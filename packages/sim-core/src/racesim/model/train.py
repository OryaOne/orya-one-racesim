from __future__ import annotations

from racesim.model.predictor import PacePredictor


def main() -> None:
    predictor = PacePredictor()
    artifact = predictor.train(force=True)
    if artifact is None:
        print("PyTorch is not available. No model artifact was created.")
        return
    print(f"Saved model artifact to {artifact}")


if __name__ == "__main__":
    main()

