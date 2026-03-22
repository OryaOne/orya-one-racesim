# Architecture Overview

Orya One RaceSim stays intentionally small. The project is split so the UI, API, and simulation logic can evolve without pulling the whole repo apart.

## Repository structure

```text
apps/
  api/        FastAPI HTTP service
  web/        Next.js App Router frontend
packages/
  sim-core/   Shared simulation, strategy, event, and model code
data/         2026 Formula 1 season catalogs, schemas, and training data
docs/         Technical and release-facing notes
```

## End-to-end flow

1. The frontend loads the 2026 season defaults from the API.
2. The user configures a Grand Prix weekend in the simulator.
3. The API validates the request and forwards it into `packages/sim-core`.
4. `sim-core` resolves:
   - pace prior estimation
   - strategy scoring and recommendations
   - race-control event generation
   - Monte Carlo race simulation
5. The API returns typed results for the UI to render as charts, tables, summary cards, and driver notes.

## Layer breakdown

### `apps/web`

Responsibilities:

- landing, simulator, and methodology pages
- control grouping and chart rendering
- results presentation
- copy, framing, and interaction flow

### `apps/api`

Responsibilities:

- HTTP transport
- typed request and response boundaries
- defaults, strategy suggestion, and simulation endpoints
- translation of lookup failures into API errors

### `packages/sim-core`

Responsibilities:

- loading the 2026 season catalogs
- pace-model training and inference
- strategy scoring
- event generation
- Monte Carlo race resolution
- driver, team, and scenario summaries

## Why the hybrid split matters

The project does not try to force everything through a single black-box model.

- The neural model estimates baseline pace.
- The explicit rules layer handles race mechanics that should stay visible.
- The event engine introduces uncertainty.
- Monte Carlo aggregation turns that uncertainty into distributions.

That split is the main architectural decision in the repo.

## What is real and what is modeled

Real 2026 season data in the current app:

- team names
- driver names
- Grand Prix names
- circuit names
- calendar order
- Sprint weekend flags

Modeled or estimated data in the current app:

- team performance priors
- driver performance priors
- circuit behavior weights
- event priors
- strategy scores

## Current realism boundary

The current architecture supports useful Grand Prix scenario work, but it is not yet:

- lap-by-lap race simulation
- standalone qualifying-session simulation
- calibrated to official telemetry or race-control logs
- driven by a full historical results ingestion pipeline

Those are potential extensions, not missing pieces in the current design.
