# Orya One RaceSim

[![Live demo](https://img.shields.io/badge/live%20demo-orya--one--racesim.vercel.app-e12944?style=flat-square&logo=vercel)](https://orya-one-racesim.vercel.app)
[![Status](https://img.shields.io/badge/status-2026%20season%20mvp-0f172a?style=flat-square)](https://orya-one-racesim.vercel.app)
[![Engine](https://img.shields.io/badge/engine-lap--by--lap-111111?style=flat-square)](https://orya-one-racesim.vercel.app/methodology)
[![Next.js](https://img.shields.io/badge/Next.js-15-111111?style=flat-square&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-0f766e?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-1d4ed8?style=flat-square&logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-b45309?style=flat-square)](./LICENSE)

Orya One RaceSim is an open-source 2026 Formula 1 Grand Prix simulator built for scenario analysis. It uses the real 2026 teams, drivers, and calendar, then runs Monte Carlo weekends through a lap-by-lap race engine that models tire life, pit windows, weather shifts, race control events, overtaking, and finishing outcomes.

Live website: [orya-one-racesim.vercel.app](https://orya-one-racesim.vercel.app)

## What is in the current build

- real 2026 Formula 1 season structure
- 11 teams and 22 drivers
- 24-round Grand Prix calendar with Sprint flags where relevant
- lap-by-lap race simulation as the main runtime engine
- strategy templates with pit windows, crossover logic, and event-aware adaptation
- weather shifts, VSC, safety car, red flag, and DNF pressure
- Monte Carlo outputs for wins, podiums, points, DNFs, stops, pit laps, and race volatility

The season entities are real. The performance priors and event assumptions are still modeled inputs, not official timing or telemetry feeds.

## Why this project exists

Most public race simulators either stay too shallow to be useful or bury too much of the logic inside opaque scores.

This project takes the opposite approach:

- use a small learned pace prior where it helps
- keep race mechanics explicit
- simulate the race as it unfolds lap by lap
- aggregate outcomes as distributions instead of pretending there is one exact answer

The point is not to claim certainty. The point is to make the assumptions visible enough that the result can be tested, tuned, and improved.

## Live links

- Live app: [https://orya-one-racesim.vercel.app](https://orya-one-racesim.vercel.app)
- Canonical repo: [https://github.com/OryaOne/orya-one-racesim](https://github.com/OryaOne/orya-one-racesim)
- Personal mirror: [https://github.com/dkampouridis/orya-one-racesim](https://github.com/dkampouridis/orya-one-racesim)

## How the simulator works

### 1. Pace prior

A compact PyTorch MLP estimates a baseline pace prior from tabular driver and circuit features.

It does not produce the finishing order directly.

### 2. Strategy layer

Strategy templates define:

- starting compound and stint sequence
- planned pit windows
- aggression and flexibility
- track-position bias
- deployment bias
- safety-car bias
- weather adaptability

The app can use suggested strategies or explicit manual assignments.

### 3. Lap-by-lap race engine

Each Monte Carlo run now simulates the race in sequence:

1. build a grid from qualifying-influenced baseline pace
2. initialize driver race state
3. simulate every lap for every car
4. update tire wear, fuel load, energy state, track grip, and traffic
5. trigger pit stops from plan, tire cliff, neutralization, or weather crossover
6. apply VSC, safety car, red flag, and incident effects on specific laps
7. resolve overtaking opportunities based on gaps, pace delta, track difficulty, and restart state
8. classify the final order from cumulative race time

### 4. Monte Carlo aggregation

After many full race runs, the app aggregates:

- win probability
- podium probability
- points probability
- expected finish
- expected points
- DNF probability
- expected stop count
- average first pit lap
- average overtakes
- event frequency and turning points

## Quick start

### 1. Create a Python environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
make setup
```

Equivalent manual steps:

```bash
pip install -r apps/api/requirements.txt
pip install -e packages/sim-core
npm install
```

### 3. Start the API

```bash
make dev-api
```

### 4. Start the web app

```bash
make dev-web
```

Local development targets `http://localhost:8000/api` by default.

## Development commands

```bash
make dev-api
make dev-web
make train-model
make test
make lint-web
make build-web
make check
```

## Tests

Primary checks:

```bash
pytest
cd apps/web && npm run lint
cd apps/web && npm run build
```

`apps/api/tests/test_api.py` skips cleanly if `fastapi` is not installed in the active interpreter.

## Documentation

- [docs/architecture.md](./docs/architecture.md)
- [docs/methodology.md](./docs/methodology.md)
- [docs/data-model.md](./docs/data-model.md)
- [docs/lap-by-lap-engine.md](./docs/lap-by-lap-engine.md)
- [docs/demo-guide.md](./docs/demo-guide.md)
- [docs/deployment.md](./docs/deployment.md)
- [docs/roadmap.md](./docs/roadmap.md)

## Suggested screenshots

- simulator overview with the active Grand Prix header, timing strip, and strategy rail
- post-run outcome board showing projected order, win share, and event pressure
- strategy and diagnostics views after a race run
- methodology page showing the lap-by-lap engine notes

See [docs/demo-guide.md](./docs/demo-guide.md) for a full capture order.

## Project structure

```text
apps/
  api/        FastAPI service
  web/        Next.js frontend
packages/
  sim-core/   Shared simulation, lap engine, strategy logic, and model code
data/         2026 season catalogs, schemas, and training data
docs/         Technical and release-facing documentation
```

## Current realism boundary

The app is much closer to race flow than the earlier aggregate model, but it is still intentionally bounded:

- overtaking is lap-based, not corner-by-corner
- tire behavior is modeled, not supplier-calibrated
- qualifying is still integrated into race setup, not a separate session engine
- Sprint weekends are represented in the weekend frame, but not yet simulated as full Sprint races
- no official FIA timing or telemetry ingestion yet

## Roadmap

Near-term work:

- standalone qualifying simulation
- full Sprint-race weekend flow
- richer pit optimizer and undercut / overcut search
- teammate interactions and team-order logic
- calibration from real FIA timing and event history

Longer-term work:

- sector-level race state
- deeper restart behavior
- richer wet crossover modeling
- benchmarking and calibration tooling

## Contributing

Contributions are welcome. Keep them focused, tested, and documented.

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
