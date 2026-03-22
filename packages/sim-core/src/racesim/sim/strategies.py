from __future__ import annotations

from dataclasses import dataclass

from racesim.api.contracts import DriverOverride, EnvironmentControls, SimulationWeights, StrategySuggestion, StrategySuggestionRequest
from racesim.data.loaders import get_strategy, get_track, get_weather, load_drivers, load_strategy_templates
from racesim.data.models import DriverProfile, StrategyTemplate, TrackProfile, WeatherPreset


@dataclass
class StrategyFit:
    strategy: StrategyTemplate
    score: float
    reasons: list[str]
    tradeoff: str


def apply_overrides(driver: DriverProfile, overrides: list[DriverOverride]) -> DriverProfile:
    override_map = {item.driver_id: item for item in overrides}
    override = override_map.get(driver.id)
    if not override:
        return driver
    payload = driver.model_dump()
    payload["recent_form"] += override.recent_form_delta
    payload["qualifying_strength"] += override.qualifying_delta
    payload["tire_management"] += override.tire_management_delta
    payload["overtaking"] += override.overtaking_delta
    payload["consistency"] += override.consistency_delta
    payload["aggression"] += override.aggression_delta
    return DriverProfile.model_validate(payload)


def evaluate_strategy(
    driver: DriverProfile,
    track: TrackProfile,
    weather: WeatherPreset,
    strategy: StrategyTemplate,
    weights: SimulationWeights,
    environment: EnvironmentControls,
) -> StrategyFit:
    score = 49.0
    reasons: list[str] = []
    tradeoff = "balanced race-day profile with moderate upside and limited downside if the weekend stays near baseline"

    avg_pit_window = sum(strategy.pit_windows) / max(1, len(strategy.pit_windows))
    first_stop_ratio = strategy.pit_windows[0] / max(1, track.laps)
    tire_resilience = (driver.tire_management / 100.0) * (1.0 - strategy.tire_load)
    track_position_pressure = track.track_position_importance * track.qualifying_importance
    caution_pressure = max(environment.full_safety_cars, weather.safety_car_probability, track.safety_car_risk)
    weather_pressure = max(environment.rain_onset, weather.rain_onset_probability)
    energy_pressure = track.energy_sensitivity * max(
        weights.energy_deployment_weight,
        environment.energy_deployment_intensity,
    )
    sprint_pressure = 0.08 if track.sprint_weekend else 0.0

    if tire_resilience > 0.45:
        score += 10.0
        reasons.append("strong tire conservation supports a longer opening stint")

    if track_position_pressure > 0.52 and strategy.track_position_bias > 0.62 and driver.qualifying_strength > 82:
        score += 8.6 * weights.qualifying_importance
        reasons.append("qualifying and track position carry unusual weight at this circuit")

    if (
        track.overtaking_difficulty < 0.55
        and strategy.aggression > 0.65
        and driver.overtaking > 80
        and strategy.energy_bias > 0.6
    ):
        score += 6.6 * weights.overtaking_sensitivity
        reasons.append("active-aero and deployment windows keep the undercut threat live")

    if energy_pressure > 0.44 and strategy.energy_bias > 0.72 and driver.energy_management > 82:
        score += 7.4 * weights.energy_deployment_weight
        reasons.append("2026 energy demand favors a stronger deployment plan here")

    if strategy.safety_car_bias * caution_pressure > 0.14:
        score += 6.0
        reasons.append("higher safety-car pressure increases the value of flexible stop timing")

    if strategy.weather_adaptability * weather_pressure > 0.16:
        score += 7.2
        reasons.append("rain-risk conditions favor an adaptable crossover plan")

    if track.sprint_weekend and strategy.qualifying_bias > 0.65:
        score += 3.4 + sprint_pressure * 8.0
        reasons.append("the Sprint format adds value to a stronger parc ferme baseline")

    if track.fuel_sensitivity > 0.57 and strategy.pit_stop_count > 1:
        score -= track.fuel_sensitivity * weights.fuel_effect_weight * 5.2
        tradeoff = "higher pace upside, but the extra stop count leaves less margin on fuel-sensitive tracks"

    if avg_pit_window > track.laps * 0.42 and strategy.flexibility > 0.68 and track.strategy_flexibility > 0.5:
        score += 3.8
        reasons.append("later pit windows preserve optionality if race control intervenes late")

    if first_stop_ratio < 0.3 and track.tire_stress > 0.64 and strategy.aggression > 0.7:
        score += 4.2
        tradeoff = "strong undercut upside, but it depends on clean air and disciplined stop timing"

    if strategy.pit_stop_count == 1 and track_position_pressure > 0.55:
        score += 4.0
        tradeoff = "protects track position and pit-loss exposure, but late-stint wear can become the limiting factor"

    deg_penalty = track.tire_stress * strategy.tire_load * weights.tire_wear_weight * 9.5
    score -= deg_penalty
    if deg_penalty > 4.2:
        reasons.append("high tire exposure adds late-stint degradation risk")
        if strategy.pit_stop_count == 1:
            tradeoff = "minimizes pit loss, but tire fade becomes the main liability"

    pit_penalty = strategy.pit_stop_count * track.pit_loss_seconds * weights.pit_stop_delta_sensitivity * 0.28
    score -= pit_penalty
    if pit_penalty > 8.5:
        tradeoff = "fresh-tire pace is available, but the extra pit delta needs overtaking support"

    if driver.consistency > 84 and strategy.flexibility > 0.6:
        score += 4.8
        reasons.append("consistency gives the team room to hold optionality deeper into the race")

    if track.weather_volatility > 0.45 and strategy.weather_adaptability < 0.45:
        score -= 3.4

    if weather_pressure < 0.18 and strategy.weather_adaptability > 0.8 and strategy.pit_stop_count > 1:
        tradeoff = "weather flexibility is available, but the dry-race baseline gives away some efficiency"

    if not reasons:
        reasons.append("balanced profile offers the lowest-regret baseline for this Grand Prix")

    return StrategyFit(strategy=strategy, score=score, reasons=reasons[:3], tradeoff=tradeoff)


def risk_profile_for(strategy: StrategyTemplate, weather: WeatherPreset, environment: EnvironmentControls) -> str:
    volatility = strategy.aggression * 0.55 + environment.randomness_intensity * 0.3 + weather.rain_onset_probability * 0.2
    if volatility < 0.35:
        return "Low"
    if volatility < 0.55:
        return "Balanced"
    if volatility < 0.73:
        return "Assertive"
    return "High Variance"


def suggest_strategies(request: StrategySuggestionRequest) -> list[StrategySuggestion]:
    track = get_track(request.grand_prix_id)
    weather = get_weather(request.weather_preset_id)
    templates = load_strategy_templates()
    suggestions: list[StrategySuggestion] = []

    for raw_driver in load_drivers():
        driver = apply_overrides(raw_driver, request.driver_overrides)
        fits = [
            evaluate_strategy(driver, track, weather, template, request.weights, request.environment)
            for template in templates
        ]
        best = sorted(fits, key=lambda item: item.score, reverse=True)[0]
        suggestions.append(
            StrategySuggestion(
                driver_id=driver.id,
                strategy_id=best.strategy.id,
                strategy_name=best.strategy.name,
                score=round(best.score, 2),
                risk_profile=risk_profile_for(best.strategy, weather, request.environment),
                rationale=best.reasons,
                tradeoff=best.tradeoff,
            )
        )
    return suggestions


def strategy_lookup(strategy_id: str) -> StrategyTemplate:
    return get_strategy(strategy_id)
