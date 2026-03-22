from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


class TeamProfile(BaseModel):
    id: str
    name: str
    color: str
    pit_crew_efficiency: float
    reliability_base: float
    race_pace: float
    qualifying_pace: float
    energy_efficiency: float


class DriverProfile(BaseModel):
    id: str
    name: str
    team_id: str
    car_number: int
    recent_form: float
    qualifying_strength: float
    tire_management: float
    overtaking: float
    consistency: float
    aggression: float
    energy_management: float
    wet_weather_skill: float
    reliability: float


class TrackProfile(BaseModel):
    id: str
    name: str
    circuit_name: str
    country: str
    calendar_round: int
    circuit_type: str
    sprint_weekend: bool = False
    homologation_note: str | None = None
    laps: int
    lap_length_km: float
    base_race_time_sec: float
    overtaking_difficulty: float
    tire_stress: float
    fuel_sensitivity: float
    pit_loss_seconds: float
    track_position_importance: float
    qualifying_importance: float
    weather_volatility: float
    surface_evolution: float
    safety_car_risk: float
    strategy_flexibility: float
    energy_sensitivity: float
    degradation_profile: str
    summary: str


class StrategyTemplate(BaseModel):
    id: str
    name: str
    description: str
    compound_sequence: List[str]
    pit_windows: List[int]
    aggression: float
    flexibility: float
    tire_load: float
    track_position_bias: float
    qualifying_bias: float
    energy_bias: float
    safety_car_bias: float
    weather_adaptability: float

    @property
    def pit_stop_count(self) -> int:
        return len(self.pit_windows)


class WeatherPreset(BaseModel):
    id: str
    label: str
    dry_bias: float
    rain_onset_probability: float
    track_evolution: float
    temperature_variation: float
    yellow_flag_probability: float
    vsc_probability: float
    safety_car_probability: float
    red_flag_probability: float
    dnf_probability: float


class DatasetBundle(BaseModel):
    drivers: List[DriverProfile]
    teams: List[TeamProfile]
    grands_prix: List[TrackProfile] = Field(alias="tracks")
    strategy_templates: List[StrategyTemplate]
    weather_presets: List[WeatherPreset]
