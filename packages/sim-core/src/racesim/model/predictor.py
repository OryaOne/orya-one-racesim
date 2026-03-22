from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence

import numpy as np

from racesim.data.loaders import load_training_frame
from racesim.paths import data_root

try:
    import torch
    import torch.nn as nn
except Exception:  # pragma: no cover - fallback is tested instead
    torch = None
    nn = None


FEATURE_COLUMNS = [
    "recent_form",
    "qualifying_strength",
    "tire_management",
    "overtaking",
    "consistency",
    "aggression",
    "wet_weather_skill",
    "reliability",
    "track_tire_stress",
    "overtaking_difficulty",
    "track_position_importance",
    "fuel_sensitivity",
    "pit_loss_norm",
    "weather_risk",
]

TARGET_COLUMN = "target_pace"


if nn is not None:
    class PaceNet(nn.Module):
        def __init__(self, input_dim: int) -> None:
            super().__init__()
            self.network = nn.Sequential(
                nn.Linear(input_dim, 24),
                nn.ReLU(),
                nn.Linear(24, 12),
                nn.ReLU(),
                nn.Linear(12, 1),
            )

        def forward(self, x):  # type: ignore[override]
            return self.network(x)
else:
    class PaceNet:  # pragma: no cover - only used to keep imports safe when torch is unavailable
        def __init__(self, input_dim: int) -> None:
            raise RuntimeError("PyTorch is not available")


@dataclass
class ModelArtifacts:
    means: list[float]
    stds: list[float]


class PacePredictor:
    def __init__(self, model_dir: Path | None = None) -> None:
        self.model_dir = model_dir or data_root() / "model"
        self.model_path = self.model_dir / "pace_model.pt"
        self.meta_path = self.model_dir / "pace_model_meta.json"
        self._model = None
        self._artifacts: ModelArtifacts | None = None

    @property
    def model_available(self) -> bool:
        return bool(torch) and self.model_path.exists() and self.meta_path.exists()

    def train(self, force: bool = False, epochs: int = 350) -> Path | None:
        if torch is None:
            return None
        if self.model_available and not force:
            return self.model_path

        frame = load_training_frame()
        x = frame[FEATURE_COLUMNS].to_numpy(dtype=np.float32)
        y = frame[TARGET_COLUMN].to_numpy(dtype=np.float32).reshape(-1, 1)
        means = x.mean(axis=0)
        stds = x.std(axis=0) + 1e-6
        x_norm = (x - means) / stds

        model = PaceNet(x.shape[1])
        optimizer = torch.optim.Adam(model.parameters(), lr=0.01)
        loss_fn = nn.MSELoss()
        x_tensor = torch.tensor(x_norm, dtype=torch.float32)
        y_tensor = torch.tensor(y, dtype=torch.float32)

        for _ in range(epochs):
            optimizer.zero_grad()
            predictions = model(x_tensor)
            loss = loss_fn(predictions, y_tensor)
            loss.backward()
            optimizer.step()

        self.model_dir.mkdir(parents=True, exist_ok=True)
        torch.save(model.state_dict(), self.model_path)
        self.meta_path.write_text(json.dumps({"means": means.tolist(), "stds": stds.tolist()}, indent=2))
        self._model = model
        self._artifacts = ModelArtifacts(means=means.tolist(), stds=stds.tolist())
        return self.model_path

    def _load_model(self) -> tuple[PaceNet | None, ModelArtifacts | None]:
        if not self.model_available:
            return None, None
        if self._model is None and torch is not None:
            model = PaceNet(len(FEATURE_COLUMNS))
            model.load_state_dict(torch.load(self.model_path, map_location="cpu"))
            model.eval()
            meta = json.loads(self.meta_path.read_text())
            self._model = model
            self._artifacts = ModelArtifacts(means=meta["means"], stds=meta["stds"])
        return self._model, self._artifacts

    def predict(self, feature_vector: dict[str, float]) -> float:
        ordered = np.array([feature_vector[column] for column in FEATURE_COLUMNS], dtype=np.float32)
        model, artifacts = self._load_model()
        if model is not None and artifacts is not None and torch is not None:
            means = np.array(artifacts.means, dtype=np.float32)
            stds = np.array(artifacts.stds, dtype=np.float32)
            normalized = (ordered - means) / stds
            with torch.no_grad():
                return float(model(torch.tensor(normalized).unsqueeze(0)).item())
        return self._heuristic_predict(ordered)

    def _heuristic_predict(self, ordered: Sequence[float]) -> float:
        feature = dict(zip(FEATURE_COLUMNS, ordered))
        score = 48.0
        score += feature["recent_form"] * 0.16
        score += feature["qualifying_strength"] * 0.12
        score += feature["tire_management"] * 0.1
        score += feature["overtaking"] * 0.06
        score += feature["consistency"] * 0.08
        score += feature["wet_weather_skill"] * 0.05 * (0.35 + feature["weather_risk"])
        score += feature["reliability"] * 0.07
        score -= feature["aggression"] * 0.015
        score -= feature["track_tire_stress"] * (1.2 - feature["tire_management"] / 100.0) * 12
        score -= feature["overtaking_difficulty"] * (1.1 - feature["overtaking"] / 100.0) * 8
        score -= feature["track_position_importance"] * (1.1 - feature["qualifying_strength"] / 100.0) * 7
        score -= feature["fuel_sensitivity"] * 3.0
        score -= feature["pit_loss_norm"] * 2.5
        return float(score / 1.6)
