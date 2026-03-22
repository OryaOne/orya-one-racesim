from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd

from racesim.data.models import DriverProfile, StrategyTemplate, TeamProfile, TrackProfile, WeatherPreset
from racesim.paths import data_root


class CatalogLookupError(ValueError):
    pass


def _load_json(path: Path) -> Any:
    return json.loads(path.read_text())


def _require_match(items: list[Any], attribute: str, value: str, entity: str):
    for item in items:
        if getattr(item, attribute) == value:
            return item
    raise CatalogLookupError(f"{entity} '{value}' was not found in the 2026 Formula 1 catalog.")


@lru_cache(maxsize=1)
def load_teams() -> list[TeamProfile]:
    return [TeamProfile.model_validate(item) for item in _load_json(data_root() / "drivers" / "teams.json")]


@lru_cache(maxsize=1)
def load_drivers() -> list[DriverProfile]:
    return [DriverProfile.model_validate(item) for item in _load_json(data_root() / "drivers" / "drivers.json")]


@lru_cache(maxsize=1)
def load_tracks() -> list[TrackProfile]:
    return [TrackProfile.model_validate(item) for item in _load_json(data_root() / "tracks" / "grands_prix.json")]


@lru_cache(maxsize=1)
def load_strategy_templates() -> list[StrategyTemplate]:
    return [
        StrategyTemplate.model_validate(item)
        for item in _load_json(data_root() / "strategies" / "strategy_templates.json")
    ]


@lru_cache(maxsize=1)
def load_weather_presets() -> list[WeatherPreset]:
    return [WeatherPreset.model_validate(item) for item in _load_json(data_root() / "weather" / "weather_event_priors.json")]


def load_training_frame() -> pd.DataFrame:
    return pd.read_csv(data_root() / "model" / "training_samples.csv")


def get_driver(driver_id: str) -> DriverProfile:
    return _require_match(load_drivers(), "id", driver_id, "Driver")


def get_team(team_id: str) -> TeamProfile:
    return _require_match(load_teams(), "id", team_id, "Team")


def get_track(track_id: str) -> TrackProfile:
    return _require_match(load_tracks(), "id", track_id, "Grand Prix")


def get_strategy(strategy_id: str) -> StrategyTemplate:
    return _require_match(load_strategy_templates(), "id", strategy_id, "Strategy")


def get_weather(weather_id: str) -> WeatherPreset:
    return _require_match(load_weather_presets(), "id", weather_id, "Weather preset")


def build_defaults_payload() -> dict[str, Any]:
    return {
        "drivers": [driver.model_dump() for driver in load_drivers()],
        "teams": [team.model_dump() for team in load_teams()],
        "grands_prix": [track.model_dump() for track in load_tracks()],
        "strategy_templates": [strategy.model_dump() for strategy in load_strategy_templates()],
        "weather_presets": [weather.model_dump() for weather in load_weather_presets()],
    }
