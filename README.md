# Orya One RaceSim

![Status](https://img.shields.io/badge/status-2026%20season%20mvp-0f172a?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-15-111111?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-0f766e?style=flat-square&logo=fastapi)
![Python](https://img.shields.io/badge/Python-3.11+-1d4ed8?style=flat-square&logo=python)
![License](https://img.shields.io/badge/license-MIT-b45309?style=flat-square)

Orya One RaceSim is an open-source 2026 Formula 1 Grand Prix simulator built for scenario analysis. It combines a small neural pace prior, explicit race and strategy logic, a race-control event layer, and Monte Carlo aggregation in a web app that is meant to be inspectable and easy to extend.

The current release is built around the real 2026 Formula 1 season structure:

- 11 teams
- 22 drivers
- the 24-round Grand Prix calendar
- Sprint weekend flagging where relevant

The model inputs layered on top of that season frame are still estimated. The app uses real 2026 entities, but it is not claiming access to official timing, telemetry, or private team data.

## What the app does

- choose any 2026 Formula 1 Grand Prix
- review the circuit profile and weekend context
- tune race control, weather, tire, and variance assumptions
- assign or compare strategy plans
- run Monte Carlo race simulations
- inspect win, podium, points, finish-position, and DNF probabilities
- read short driver and event summaries tied to real simulation outputs

## Why this project exists

Most public motorsport simulators either hide their assumptions or stay too shallow to be useful for scenario work.

This project takes a different path:

- a neural model estimates baseline pace
- deterministic logic handles the race mechanics that should stay explicit
- an event engine introduces believable uncertainty
- Monte Carlo aggregation turns everything into distributions instead of hard claims

The point is not to produce a magic prediction. The point is to make the assumptions clear enough that the result can be challenged, tuned, and improved.

## 2026 Formula 1 focus

The current build is no longer a generic motorsport demo. It is framed directly around the 2026 Formula 1 season, including:

- real 2026 teams and drivers
- official 2026 Grand Prix naming
- circuit-specific behavior across the full calendar
- Sprint weekend handling in the catalog and scenario layer
- 2026-aware language around deployment, active aero, and overtaking support

Examples of track-specific behavior already modeled:

- Monaco is heavily qualifying and track-position driven
- Monza puts more weight on deployment and low-drag race shape
- Singapore carries higher interruption pressure
- Spa has stronger weather variability
- Zandvoort is harder to pass
- Baku has more restart and safety-car volatility
- Las Vegas leans low-grip and straight-line sensitive

## Hybrid simulation overview

### Pace prior

A compact PyTorch MLP estimates a baseline pace prior from driver and circuit features.

It does not predict the finishing order directly.

### Deterministic race logic

The explicit rules layer models:

- qualifying leverage
- tire degradation
- pit-loss delta
- fuel sensitivity
- reliability pressure
- deployment sensitivity
- strategy-template tradeoffs

### Strategy engine

The strategy layer scores templates against:

- track position pressure
- qualifying importance
- tire stress
- safety-car pressure
- weather risk
- deployment sensitivity
- driver strengths such as tire management and consistency

### Event engine

The event layer models:

- wet starts
- weather shifts
- yellow flags
- VSCs
- safety cars
- red flags
- incidents
- DNFs
- late-race disruptions

### Monte Carlo output

The simulator aggregates:

- finish distributions
- win probability
- podium probability
- points probability
- expected points
- DNF probability
- strategy success
- event-impact summary
- constructors outlook

## Current realism boundary

This is still an MVP. A few important pieces are simplified on purpose:

- race resolution is event-aware and stint-aware rather than full lap-by-lap
- qualifying influence is modeled inside race performance instead of through a separate session simulator
- 2026 deployment and active-aero behavior are represented as scenario levers, not detailed control laws
- team and driver priors are estimated rather than learned from full 2026 race datasets

Those are explicit boundaries, not hidden caveats.

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

The frontend targets `http://localhost:8000/api` by default in local development.

## Demo presets

The simulator includes a few preset weekends intended for demos and screenshots:

- `Spa weather swing`
- `Monaco track position`
- `Monza deployment attack`

## Project structure

```text
apps/
  api/        FastAPI service
  web/        Next.js frontend
packages/
  sim-core/   Shared simulation, strategy, event, and model code
data/         2026 season catalogs, schemas, and training data
docs/         Technical and release-facing documentation
```

## Documentation

- [docs/architecture.md](docs/architecture.md)
- [docs/methodology.md](docs/methodology.md)
- [docs/data-model.md](docs/data-model.md)
- [docs/roadmap.md](docs/roadmap.md)
- [docs/demo-guide.md](docs/demo-guide.md)
- [docs/deployment.md](docs/deployment.md)

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

## Roadmap

Near-term work:

- qualifying-session simulation
- deeper Sprint-weekend handling
- richer weather transitions by lap window
- better pit-stop optimization and undercut / overcut search
- calibration against historical Formula 1 data

Longer-term work:

- lap-by-lap race mode
- teammate interactions and team-order logic
- restart behavior and bunching detail
- benchmark and calibration workflows

## Contributing

Contributions are welcome. Please keep them focused, well-tested, and documented.

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup, expectations, and PR guidance.

## License

[MIT](LICENSE)
