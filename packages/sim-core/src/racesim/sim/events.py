from __future__ import annotations

import random
from dataclasses import dataclass

from racesim.api.contracts import EnvironmentControls
from racesim.data.models import DriverProfile, TrackProfile, WeatherPreset


@dataclass
class RaceEvents:
    wet_start: bool
    weather_shift: bool
    yellow_flag: bool
    vsc: bool
    safety_car: bool
    red_flag: bool
    late_incident: bool
    degradation_multiplier: float
    overtaking_window: float
    energy_management_multiplier: float
    pit_discount: float
    event_pressure: float
    narrative: list[str]


@dataclass
class DriverIncident:
    dnf: bool
    time_loss_sec: float
    notes: list[str]


class EventEngine:
    def __init__(self, rng: random.Random) -> None:
        self.rng = rng

    def race_events(self, track: TrackProfile, weather: WeatherPreset, env: EnvironmentControls) -> RaceEvents:
        complexity_multiplier = 1.0 + (env.randomness_intensity - 0.5) * 0.8
        wet_start = self.rng.random() < max(0.02, (1.0 - env.dry_race) * weather.rain_onset_probability * 0.8)
        weather_shift_probability = max(
            env.rain_onset,
            weather.rain_onset_probability * (0.7 + track.weather_volatility),
        )
        weather_shift = not wet_start and self.rng.random() < min(0.82, weather_shift_probability * complexity_multiplier)

        caution_pressure = (
            max(env.yellow_flags, weather.yellow_flag_probability) * 0.46
            + max(env.virtual_safety_cars, weather.vsc_probability) * 0.22
            + max(env.full_safety_cars, weather.safety_car_probability) * 0.22
            + env.crashes * 0.1
        ) * (
            0.88
            + track.track_position_importance * 0.18
            + track.safety_car_risk * 0.22
            + (0.08 if track.circuit_type == "street" else 0.03 if track.circuit_type == "semi-street" else 0.0)
        )
        yellow_flag = self.rng.random() < min(0.86, caution_pressure * complexity_multiplier)

        vsc_probability = max(env.virtual_safety_cars, weather.vsc_probability) * (
            0.72 + track.overtaking_difficulty * 0.18 + track.safety_car_risk * 0.1
        )
        vsc = yellow_flag and self.rng.random() < min(0.74, vsc_probability * complexity_multiplier)

        safety_car_probability = (
            max(env.full_safety_cars, weather.safety_car_probability, track.safety_car_risk)
            * (0.76 + track.track_position_importance * 0.2)
            * (1.0 + 0.2 * int(wet_start or weather_shift))
        )
        safety_car = self.rng.random() < min(0.64, safety_car_probability * complexity_multiplier)

        red_flag_probability = max(env.red_flags, weather.red_flag_probability) * (
            0.9 + 0.35 * int(wet_start or weather_shift) + 0.15 * int(safety_car)
        )
        red_flag = self.rng.random() < min(0.22, red_flag_probability * complexity_multiplier)
        late_incident = self.rng.random() < min(
            0.58,
            env.late_race_incidents * (0.9 + track.weather_volatility * 0.4 + track.overtaking_difficulty * 0.2),
        )

        degradation_multiplier = 1.0
        overtaking_window = 1.0 + track.energy_sensitivity * 0.05 - track.overtaking_difficulty * 0.04
        energy_management_multiplier = 1.0
        pit_discount = 1.0
        narrative: list[str] = []

        if wet_start:
            degradation_multiplier += 0.08
            overtaking_window -= 0.06
            energy_management_multiplier += 0.04
            narrative.append("the race starts with reduced grip and a less stable deployment picture")
        if weather_shift:
            degradation_multiplier += 0.12
            overtaking_window -= 0.08
            energy_management_multiplier += 0.08
            narrative.append("a mid-race weather crossover increases strategy timing pressure")
        if safety_car:
            pit_discount -= 0.17
            energy_management_multiplier -= 0.03
            narrative.append("a safety-car phase compresses gaps and lowers the cost of stopping")
        elif vsc:
            pit_discount -= 0.08
            energy_management_multiplier -= 0.02
            narrative.append("VSC exposure modestly improves opportunistic pit timing")
        if red_flag:
            degradation_multiplier -= 0.04
            energy_management_multiplier -= 0.05
            narrative.append("a red flag resets tire age pressure more than a normal caution window")
        if late_incident:
            overtaking_window -= 0.05
            energy_management_multiplier += 0.05
            narrative.append("late-race disruption raises closing-lap volatility")

        event_pressure = min(
            1.0,
            0.28
            + 0.18 * int(wet_start or weather_shift)
            + 0.16 * int(yellow_flag)
            + 0.18 * int(safety_car)
            + 0.12 * int(red_flag)
            + 0.1 * int(late_incident),
        )
        return RaceEvents(
            wet_start=wet_start,
            weather_shift=weather_shift,
            yellow_flag=yellow_flag,
            vsc=vsc,
            safety_car=safety_car,
            red_flag=red_flag,
            late_incident=late_incident,
            degradation_multiplier=degradation_multiplier,
            overtaking_window=max(0.78, overtaking_window),
            energy_management_multiplier=max(0.82, energy_management_multiplier),
            pit_discount=max(0.72, pit_discount),
            event_pressure=event_pressure,
            narrative=narrative,
        )

    def driver_incident(
        self,
        driver: DriverProfile,
        track: TrackProfile,
        weather: WeatherPreset,
        env: EnvironmentControls,
        events: RaceEvents,
    ) -> DriverIncident:
        notes: list[str] = []
        base_dnf = max(env.dnfs, weather.dnf_probability) * (
            0.92 + driver.aggression / 240.0 + events.event_pressure * 0.22
        )
        reliability_shield = (driver.reliability / 100.0) * 0.55
        dnf_probability = max(0.01, base_dnf - reliability_shield)
        if events.wet_start or events.weather_shift:
            dnf_probability += 0.022 * (1.0 - driver.wet_weather_skill / 100.0)
        if events.red_flag:
            dnf_probability += 0.008
        if self.rng.random() < dnf_probability:
            notes.append("retired after a high-cost reliability or incident event")
            return DriverIncident(dnf=True, time_loss_sec=9999.0, notes=notes)

        local_incident_probability = min(
            0.5,
            env.crashes
            + driver.aggression / 260.0
            + (1.0 - driver.consistency / 100.0) * 0.12
            + track.overtaking_difficulty * 0.06
            + track.safety_car_risk * 0.05
            + events.event_pressure * 0.08,
        )
        time_loss = 0.0
        if self.rng.random() < local_incident_probability:
            severity = self.rng.uniform(3.5, 12.0) * (1.0 + events.event_pressure * 0.32)
            time_loss += severity
            notes.append("lost time in traffic or a recoverable on-track incident")
        if events.late_incident and self.rng.random() < 0.35 + track.overtaking_difficulty * 0.12:
            time_loss += self.rng.uniform(1.0, 4.5)
            notes.append("late-race disruption introduced additional volatility")
        return DriverIncident(dnf=False, time_loss_sec=time_loss, notes=notes)
