from pathlib import Path


def repo_root() -> Path:
    current = Path(__file__).resolve()
    for parent in current.parents:
        if (parent / "data").exists() and (parent / "apps").exists():
            return parent
    raise FileNotFoundError("Could not locate repository root containing data/ and apps/")


def data_root() -> Path:
    return repo_root() / "data"

