from __future__ import annotations

import math
import random
from collections import Counter, defaultdict
from dataclasses import dataclass

from racesim.api.contracts import (
    DriverResult,
    EventSummary,
    PositionProbability,
    ScenarioSummary,
    SimulationRequest,
    SimulationResponse,
    StrategySuggestionRequest,
    TeamSummary,
)
from racesim.data.loaders import build_defaults_payload, get_team, get_track, get_weather, load_drivers
from racesim.data.models import DriverProfile, StrategyTemplate, TrackProfile, WeatherPreset
from racesim.model.predictor import PacePredictor
from racesim.sim.events import DriverIncident, EventEngine, RaceEvents
from racesim.sim.strategies import StrategyFit, apply_overrides, evaluate_strategy, strategy_lookup, suggest_strategies


@dataclass
class DriverStaticProfile:
    driver: DriverProfile
    team_name: str
    strategy: StrategyTemplate
    strategy_fit: StrategyFit
    pace_score: float
    energy_strength: float
    event_exposure: float
    qualifying_leverage: float
    tire_risk: float
    pace_rank: int


RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]
SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1]


def build_feature_vector(driver: DriverProfile, track: TrackProfile, weather: WeatherPreset) -> dict[str, float]:
    return {
        "recent_form": driver.recent_form,
        "qualifying_strength": driver.qualifying_strength,
        "tire_management": driver.tire_management,
        "overtaking": driver.overtaking,
        "consistency": driver.consistency,
        "aggression": driver.aggression,
        "wet_weather_skill": driver.wet_weather_skill,
        "reliability": driver.reliability,
        "track_tire_stress": track.tire_stress,
        "overtaking_difficulty": track.overtaking_difficulty,
        "track_position_importance": track.track_position_importance,
        "fuel_sensitivity": track.fuel_sensitivity,
        "pit_loss_norm": min(1.0, track.pit_loss_seconds / 36.0),
        "weather_risk": max(track.weather_volatility, weather.rain_onset_probability),
    }


class SimulationService:
    def __init__(self) -> None:
        self.predictor = PacePredictor()

    def defaults(self) -> dict:
        return build_defaults_payload()

    def strategy_suggestions(self, request: StrategySuggestionRequest):
        return suggest_strategies(request)

    def simulate(self, request: SimulationRequest) -> SimulationResponse:
        track = get_track(request.grand_prix_id)
        weather = get_weather(request.weather_preset_id)
        suggestions = suggest_strategies(request)
        suggestion_map = {item.driver_id: item for item in suggestions}
        drivers = [apply_overrides(driver, request.driver_overrides) for driver in load_drivers()]

        assigned_strategies = {
            driver.id: strategy_lookup(
                request.strategies.get(driver.id) or request.field_strategy_preset or suggestion_map[driver.id].strategy_id
            )
            for driver in drivers
        }
        profiles = self._build_static_profiles(drivers, assigned_strategies, track, weather, request)

        finish_positions: dict[str, list[int]] = defaultdict(list)
        dnf_counts: Counter[str] = Counter()
        strategy_success: Counter[str] = Counter()
        event_tallies = Counter()
        incident_time_totals: Counter[str] = Counter()
        event_pressure_totals: Counter[str] = Counter()

        for run_index in range(request.simulation_runs):
            rng = random.Random(1307 + run_index)
            event_engine = EventEngine(rng)
            events = event_engine.race_events(track, weather, request.environment)
            self._record_race_events(event_tallies, events)

            run_results: list[tuple[str, float, DriverIncident]] = []
            for driver_id, profile in profiles.items():
                incident = event_engine.driver_incident(profile.driver, track, weather, request.environment, events)
                performance_index = self._resolve_driver_performance(profile, track, weather, request, events, incident, rng)

                total_time = track.base_race_time_sec - performance_index
                if incident.dnf:
                    total_time = track.base_race_time_sec + 2000 + rng.uniform(0, 100)
                    dnf_counts[driver_id] += 1
                    event_tallies["dnf_total"] += 1

                run_results.append((driver_id, total_time, incident))
                incident_time_totals[driver_id] += incident.time_loss_sec if not incident.dnf else 0.0
                event_pressure_totals[driver_id] += events.event_pressure

            ranked = sorted(run_results, key=lambda item: item[1])
            for position, (driver_id, _, incident) in enumerate(ranked, start=1):
                finish_positions[driver_id].append(position)
                if position <= profiles[driver_id].pace_rank:
                    strategy_success[driver_id] += 1
                if incident.dnf:
                    continue

        driver_results = self._build_driver_results(
            profiles=profiles,
            finish_positions=finish_positions,
            dnf_counts=dnf_counts,
            strategy_success=strategy_success,
            incident_time_totals=incident_time_totals,
            event_pressure_totals=event_pressure_totals,
            suggestions=suggestion_map,
            track=track,
            weather=weather,
            request=request,
        )

        team_summary = self._build_team_summary(driver_results)
        event_summary = self._build_event_summary(event_tallies, weather, track, request)
        scenario = ScenarioSummary(
            grand_prix_id=track.id,
            grand_prix_name=track.name,
            weather_preset_id=weather.id,
            weather_preset_name=weather.label,
            simulation_runs=request.simulation_runs,
            complexity_level=request.complexity_level,
            sprint_weekend=track.sprint_weekend,
            headline=self._headline(track, weather, request),
            strategy_outlook=self._strategy_outlook(track, weather, request),
            event_outlook=self._event_outlook(event_summary),
            confidence_note=self._confidence_note(driver_results, event_summary),
        )

        return SimulationResponse(
            scenario=scenario,
            drivers=driver_results,
            team_summary=team_summary,
            event_summary=event_summary,
            strategy_suggestions=list(suggestions),
        )

    def _build_static_profiles(
        self,
        drivers: list[DriverProfile],
        assigned_strategies: dict[str, StrategyTemplate],
        track: TrackProfile,
        weather: WeatherPreset,
        request: SimulationRequest,
    ) -> dict[str, DriverStaticProfile]:
        raw_profiles: list[DriverStaticProfile] = []
        for driver in drivers:
            strategy = assigned_strategies[driver.id]
            strategy_fit = evaluate_strategy(driver, track, weather, strategy, request.weights, request.environment)
            team = get_team(driver.team_id)
            team_baseline = (team.race_pace - 80.0) * 0.55 + (team.qualifying_pace - 80.0) * 0.18
            pace_score = self.predictor.predict(build_feature_vector(driver, track, weather)) + team_baseline
            energy_strength = min(
                1.0,
                (
                    (driver.energy_management / 100.0) * 0.62
                    + team.energy_efficiency * 0.38
                )
                * (0.82 + track.energy_sensitivity * 0.35),
            )
            event_exposure = min(
                1.0,
                0.12
                + (driver.aggression / 100.0) * 0.28
                + (1.0 - driver.reliability / 100.0) * 0.32
                + track.safety_car_risk * 0.14
                + track.weather_volatility * 0.14
                + request.environment.randomness_intensity * 0.14,
            )
            qualifying_leverage = (
                (driver.qualifying_strength / 100.0)
                * track.qualifying_importance
                * (0.72 + team.qualifying_pace / 250.0)
            )
            tire_risk = track.tire_stress * strategy.tire_load * (1.04 - driver.tire_management / 100.0)
            raw_profiles.append(
                DriverStaticProfile(
                    driver=driver,
                    team_name=team.name,
                    strategy=strategy,
                    strategy_fit=strategy_fit,
                    pace_score=pace_score,
                    energy_strength=energy_strength,
                    event_exposure=event_exposure,
                    qualifying_leverage=qualifying_leverage,
                    tire_risk=tire_risk,
                    pace_rank=0,
                )
            )

        ranked = sorted(raw_profiles, key=lambda item: item.pace_score + item.strategy_fit.score * 0.42, reverse=True)
        for index, profile in enumerate(ranked, start=1):
            profile.pace_rank = index
        return {profile.driver.id: profile for profile in raw_profiles}

    def _record_race_events(self, tallies: Counter, events: RaceEvents) -> None:
        tallies["wet_start"] += int(events.wet_start)
        tallies["weather_shift"] += int(events.weather_shift)
        tallies["yellow_flag"] += int(events.yellow_flag)
        tallies["vsc"] += int(events.vsc)
        tallies["safety_car"] += int(events.safety_car)
        tallies["red_flag"] += int(events.red_flag)
        tallies["late_incident"] += int(events.late_incident)
        tallies["event_pressure_total"] += events.event_pressure

    def _resolve_driver_performance(
        self,
        profile: DriverStaticProfile,
        track: TrackProfile,
        weather: WeatherPreset,
        request: SimulationRequest,
        events: RaceEvents,
        incident: DriverIncident,
        rng: random.Random,
    ) -> float:
        team = get_team(profile.driver.team_id)
        pace_component = profile.pace_score * (0.7 + request.weights.driver_form_weight * 0.45)
        qualifying_bonus = (
            profile.qualifying_leverage
            * request.weights.qualifying_importance
            * (0.82 + profile.strategy.qualifying_bias * 0.24)
            * 14.5
        )
        overtaking_bonus = (
            (profile.driver.overtaking / 100.0)
            * (1.0 - track.overtaking_difficulty)
            * (0.74 + profile.energy_strength * 0.3)
            * events.overtaking_window
            * request.weights.overtaking_sensitivity
            * 10.0
        )
        energy_bonus = (
            profile.energy_strength
            * track.energy_sensitivity
            * request.weights.energy_deployment_weight
            * request.environment.energy_deployment_intensity
            * events.overtaking_window
            * 12.0
        )
        tire_penalty = (
            profile.tire_risk
            * request.weights.tire_wear_weight
            * events.degradation_multiplier
            * 27.0
        )
        fuel_penalty = (
            track.fuel_sensitivity
            * (
                1.0
                + profile.strategy.track_position_bias * 0.22
                + profile.strategy.pit_stop_count * 0.07
                + profile.strategy.energy_bias * 0.06
            )
            * request.weights.fuel_effect_weight
            * 8.6
        )
        energy_penalty = (
            track.energy_sensitivity
            * (1.0 - profile.energy_strength * 0.86)
            * request.weights.energy_deployment_weight
            * events.energy_management_multiplier
            * (4.8 + profile.strategy.aggression * 3.8)
        )
        track_evolution_bonus = (
            request.environment.track_evolution
            * track.surface_evolution
            * (profile.driver.consistency / 100.0)
            * 3.2
        )
        temperature_penalty = (
            request.environment.temperature_variation
            * track.tire_stress
            * (1.04 - profile.driver.tire_management / 100.0)
            * 4.1
        )
        pit_penalty = (
            profile.strategy.pit_stop_count
            * track.pit_loss_seconds
            * request.weights.pit_stop_delta_sensitivity
            * events.pit_discount
            * (1.06 - team.pit_crew_efficiency * 0.1)
        )
        reliability_penalty = (
            (1.0 - (profile.driver.reliability / 100.0) * team.reliability_base)
            * request.weights.reliability_sensitivity
            * (11.0 + events.event_pressure * 5.0)
        )
        weather_bonus = 0.0
        if events.wet_start or events.weather_shift:
            weather_bonus += profile.strategy.weather_adaptability * 8.2 + profile.driver.wet_weather_skill / 17.0
        if events.safety_car:
            weather_bonus += profile.strategy.safety_car_bias * 7.0
        if events.red_flag:
            weather_bonus += profile.strategy.flexibility * 2.5
        if track.sprint_weekend:
            weather_bonus += profile.strategy.qualifying_bias * 1.8

        compression_penalty = (
            profile.pace_score
            * 0.028
            * events.event_pressure
            * (1.0 if events.safety_car or events.vsc else 0.55)
        )
        variance = rng.gauss(
            0.0,
            4.8
            * request.weights.stochastic_variance
            * (0.85 + request.environment.randomness_intensity * 0.55 + events.event_pressure * 0.2),
        )

        return (
            pace_component
            + profile.strategy_fit.score * 0.5
            + qualifying_bonus
            + overtaking_bonus
            + energy_bonus
            + weather_bonus
            + track_evolution_bonus
            - tire_penalty
            - fuel_penalty
            - energy_penalty
            - temperature_penalty
            - pit_penalty
            - reliability_penalty
            - compression_penalty
            - incident.time_loss_sec
            + variance
        )

    def _build_driver_results(
        self,
        profiles: dict[str, DriverStaticProfile],
        finish_positions: dict[str, list[int]],
        dnf_counts: Counter[str],
        strategy_success: Counter[str],
        incident_time_totals: Counter[str],
        event_pressure_totals: Counter[str],
        suggestions: dict,
        track: TrackProfile,
        weather: WeatherPreset,
        request: SimulationRequest,
    ) -> list[DriverResult]:
        driver_results: list[DriverResult] = []
        for driver_id, profile in profiles.items():
            positions = finish_positions[driver_id]
            mean_position = sum(positions) / len(positions)
            variance = sum((position - mean_position) ** 2 for position in positions) / len(positions)
            stddev = math.sqrt(variance)
            dnf_probability = dnf_counts[driver_id] / request.simulation_runs
            uncertainty_index = round(stddev / len(profiles), 4)
            confidence_label = self._confidence_label(uncertainty_index, profile.event_exposure, dnf_probability)
            scenario_sensitivity = round(
                (
                    request.environment.randomness_intensity
                    + weather.rain_onset_probability
                    + track.weather_volatility
                    + profile.event_exposure
                )
                / 4.0,
                4,
            )
            distribution = [
                PositionProbability(position=position, probability=round(positions.count(position) / len(positions), 4))
                for position in range(1, len(profiles) + 1)
            ]

            driver_results.append(
                DriverResult(
                    driver_id=driver_id,
                    driver_name=profile.driver.name,
                    team_id=profile.driver.team_id,
                    team_name=profile.team_name,
                    assigned_strategy_id=profile.strategy.id,
                    assigned_strategy_name=profile.strategy.name,
                    expected_finish_position=round(mean_position, 2),
                    win_probability=round(positions.count(1) / len(positions), 4),
                    podium_probability=round(sum(1 for p in positions if p <= 3) / len(positions), 4),
                    top_10_probability=round(sum(1 for p in positions if p <= 10) / len(positions), 4),
                    points_probability=round(sum(1 for p in positions if p <= 10) / len(positions), 4),
                    dnf_probability=round(dnf_probability, 4),
                    expected_points=round(self._expected_points(positions, profile, track), 2),
                    strategy_success_rate=round(strategy_success[driver_id] / request.simulation_runs, 4),
                    uncertainty_index=uncertainty_index,
                    confidence_label=confidence_label,
                    scenario_sensitivity=scenario_sensitivity,
                    event_exposure=round(profile.event_exposure, 4),
                    strategy_fit_score=round(profile.strategy_fit.score, 2),
                    expected_pace_score=round(profile.pace_score, 2),
                    explanation=self._explain_driver(
                        profile=profile,
                        suggestion=suggestions[driver_id],
                        track=track,
                        weather=weather,
                        dnf_probability=dnf_probability,
                        mean_incident_loss=incident_time_totals[driver_id] / max(1, request.simulation_runs),
                        mean_event_pressure=event_pressure_totals[driver_id] / max(1, request.simulation_runs),
                    ),
                    position_distribution=distribution,
                )
            )

        driver_results.sort(key=lambda item: item.expected_finish_position)
        return driver_results

    def _build_team_summary(self, driver_results: list[DriverResult]) -> list[TeamSummary]:
        grouped_team_results: dict[str, list[DriverResult]] = defaultdict(list)
        for result in driver_results:
            grouped_team_results[result.team_id].append(result)

        team_summary = [
            TeamSummary(
                team_id=team_id,
                team_name=results[0].team_name,
                avg_expected_finish=round(sum(item.expected_finish_position for item in results) / len(results), 2),
                expected_points=round(sum(item.expected_points for item in results), 2),
                combined_win_probability=round(sum(item.win_probability for item in results), 4),
                combined_podium_probability=round(sum(item.podium_probability for item in results), 4),
            )
            for team_id, results in grouped_team_results.items()
        ]
        team_summary.sort(key=lambda item: (-item.expected_points, item.avg_expected_finish))
        return team_summary

    def _build_event_summary(
        self,
        tallies: Counter,
        weather: WeatherPreset,
        track: TrackProfile,
        request: SimulationRequest,
    ) -> EventSummary:
        runs = request.simulation_runs
        rates = {
            "Weather shift": tallies["weather_shift"] / runs,
            "Yellow flag": tallies["yellow_flag"] / runs,
            "VSC": tallies["vsc"] / runs,
            "Safety car": tallies["safety_car"] / runs,
            "Red flag": tallies["red_flag"] / runs,
            "Late incident": tallies["late_incident"] / runs,
        }
        dominant_factor = max(rates.items(), key=lambda item: item[1])[0]
        volatility_index = round(
            (
                tallies["event_pressure_total"] / runs
                + weather.rain_onset_probability
                + track.weather_volatility
                + request.environment.randomness_intensity
            )
            / 4.0,
            4,
        )

        impact_summary = []
        if rates["Weather shift"] > 0.24 or tallies["wet_start"] / runs > 0.12:
            impact_summary.append("weather transitions are materially changing pit windows and crossover calls")
        if rates["Safety car"] > 0.16:
            impact_summary.append("safety-car exposure is making reactive F1 strategy calls materially stronger")
        if rates["Late incident"] > 0.16:
            impact_summary.append("late-race disruption is widening the midfield finish spread and points fight")
        if rates["Yellow flag"] < 0.16 and rates["Safety car"] < 0.1:
            impact_summary.append("the Grand Prix stays relatively clean, so underlying pace holds more of the result")
        if not impact_summary:
            impact_summary.append("event pressure remains balanced, so no single race-control channel dominates the weekend")

        return EventSummary(
            weather_shift_rate=round(rates["Weather shift"], 4),
            yellow_flag_rate=round(rates["Yellow flag"], 4),
            vsc_rate=round(rates["VSC"], 4),
            safety_car_rate=round(rates["Safety car"], 4),
            red_flag_rate=round(rates["Red flag"], 4),
            dnf_rate=round(tallies["dnf_total"] / (runs * len(load_drivers())), 4),
            late_incident_rate=round(rates["Late incident"], 4),
            volatility_index=volatility_index,
            dominant_factor=dominant_factor,
            impact_summary=impact_summary[:3],
        )

    def _headline(self, track: TrackProfile, weather: WeatherPreset, request: SimulationRequest) -> str:
        if track.sprint_weekend:
            return f"{track.name} is a Sprint weekend, so parc ferme pressure and Saturday track position matter more than in a standard format."
        if weather.rain_onset_probability > 0.45 or request.environment.rain_onset > 0.4:
            return f"{track.name} projects as an adaptive Grand Prix where crossover timing and race-control response matter more than a clean dry baseline."
        if track.qualifying_importance > 0.84:
            return f"{track.name} remains heavily qualifying-led, so track position and low-regret pit timing carry unusual weight."
        if track.energy_sensitivity > 0.8:
            return f"{track.name} puts more emphasis on 2026 energy release and active-aero efficiency than most circuits in the calendar."
        return f"{track.name} stays open enough for race pace, pit timing, and event pressure to trade influence across the field."

    def _strategy_outlook(self, track: TrackProfile, weather: WeatherPreset, request: SimulationRequest) -> str:
        if request.environment.full_safety_cars > 0.18:
            return "Flexible and safety-car-aware plans gain value because neutralized pit windows are showing up often enough to matter."
        if track.tire_stress > 0.68:
            return "Long-run tire management remains the key separator, so rigid one-stop plans carry more degradation risk."
        if track.energy_sensitivity > 0.75:
            return "Deployment management and low-drag efficiency are a bigger part of the race than usual, so passive attack profiles lose value."
        if weather.rain_onset_probability > 0.35:
            return "Weather adaptability is not optional here; rigid dry-race plans lose value once crossover pressure rises."
        return "Balanced strategies retain the best regret profile because no single race phase dominates the Grand Prix."

    def _event_outlook(self, event_summary: EventSummary) -> str:
        return f"{event_summary.dominant_factor} is the strongest race-control channel, with an overall volatility index of {event_summary.volatility_index:.2f}."

    def _confidence_note(self, driver_results: list[DriverResult], event_summary: EventSummary) -> str:
        stable_count = sum(1 for driver in driver_results if driver.confidence_label == "Stable")
        if event_summary.volatility_index > 0.5:
            return "Interpret the order as a probability map rather than a hard forecast; event pressure is high enough to widen the realistic outcome band."
        if stable_count >= 4:
            return "The front of the field is comparatively well anchored, with the biggest uncertainty concentrated deeper in the order."
        return "Confidence is moderate overall; pace and strategy still matter, but the scenario keeps enough variance to punish overconfidence."

    def _confidence_label(self, uncertainty_index: float, event_exposure: float, dnf_probability: float) -> str:
        combined = uncertainty_index * 0.5 + event_exposure * 0.35 + dnf_probability * 0.15
        if combined < 0.2:
            return "Stable"
        if combined < 0.28:
            return "Measured"
        if combined < 0.38:
            return "Exposed"
        return "High Variance"

    def _explain_driver(
        self,
        profile: DriverStaticProfile,
        suggestion,
        track: TrackProfile,
        weather: WeatherPreset,
        dnf_probability: float,
        mean_incident_loss: float,
        mean_event_pressure: float,
    ) -> list[str]:
        explanation: list[str] = []
        if profile.qualifying_leverage > 0.7:
            explanation.append("qualifying influence is unusually strong under this circuit setup")
        if profile.strategy_fit.score > 56:
            explanation.append("the assigned strategy aligns cleanly with this circuit and race-control setup")
        if profile.tire_risk > 0.42:
            explanation.append("higher tire degradation pressure is trimming the long-run projection")
        if track.energy_sensitivity > 0.72 and profile.energy_strength > 0.74:
            explanation.append("the 2026 deployment model is helping more than average at this circuit")
        if weather.rain_onset_probability > 0.3 and profile.strategy.weather_adaptability > 0.7:
            explanation.append("wet-risk conditions increase the value of the more adaptive stint structure")
        if suggestion.risk_profile in {"Assertive", "High Variance"}:
            explanation.append("strategy upside is available, but the finish range is wider than the median order suggests")
        if mean_incident_loss > 1.2 or dnf_probability > 0.09:
            explanation.append("incident exposure remains elevated enough to weaken confidence in the median finish")
        if mean_event_pressure > 0.45 and profile.strategy.safety_car_bias > 0.7:
            explanation.append("flexible pit timing gained value under the higher safety-car pressure in this setup")
        if profile.pace_rank <= 3 and profile.pace_score > 86:
            explanation.append("baseline pace remains one of the strongest in the field before event variance is applied")
        return explanation[:3] or [
            "pace, strategy, and event exposure remain balanced with no single factor fully dominating the forecast"
        ]

    def _expected_points(self, positions: list[int], profile: DriverStaticProfile, track: TrackProfile) -> float:
        race_points = sum(RACE_POINTS[position - 1] for position in positions if position <= len(RACE_POINTS)) / len(positions)
        if not track.sprint_weekend:
            return race_points

        if profile.pace_rank > len(SPRINT_POINTS):
            return race_points

        sprint_seed = SPRINT_POINTS[profile.pace_rank - 1]
        sprint_multiplier = min(
            1.0,
            0.48 + profile.qualifying_leverage * 0.36 + profile.strategy_fit.score / 140.0,
        )
        sprint_points = sprint_seed * sprint_multiplier
        return race_points + sprint_points
