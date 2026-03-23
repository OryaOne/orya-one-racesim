# Methodology

## Purpose

Orya One RaceSim is a hybrid 2026 Formula 1 simulation project. The model uses a small learned pace prior, keeps the race mechanics explicit, and resolves the race itself lap by lap.

The output should be read as a scenario distribution, not as a claim of exact prediction.

## Modeling structure

The simulator separates three pieces of logic:

1. learned pace prior
2. explicit strategy and race logic
3. probabilistic event timing

That split is deliberate and shows up across the codebase.

## 1. Pace prior

The neural component is a compact PyTorch MLP trained on tabular samples in `data/model/training_samples.csv`.

It estimates a baseline pace prior from features such as:

- recent form
- qualifying strength
- tire management
- overtaking strength
- consistency
- aggression
- wet-weather skill
- reliability
- circuit tire stress
- overtaking difficulty
- track-position weight
- fuel sensitivity
- normalized pit loss
- weather risk

Boundary:

- the model does not predict the final order directly
- it only supplies the starting pace signal for the wider race simulation

## 2. Strategy engine

Strategy templates define:

- compound sequence
- pit windows
- aggression
- flexibility
- track-position bias
- qualifying bias
- deployment bias
- safety-car bias
- weather adaptability

The strategy layer scores those templates against:

- qualifying importance
- track-position pressure
- tire stress
- safety-car pressure
- weather risk
- Sprint-weekend context
- deployment sensitivity
- driver traits such as tire management, consistency, and energy management

## 3. Lap-by-lap race engine

Each Monte Carlo run now builds a real race state and simulates every lap in order.

Each driver tracks:

- current position
- total race time
- starting grid position
- current compound
- tire age and tire wear
- fuel load
- energy state
- pit stop count
- planned strategy phase
- traffic load
- damage / incident loss
- DNF state

Every lap updates:

- lap-time potential
- tire wear and cliff pressure
- fuel effect
- energy deployment payoff
- traffic and dirty-air cost
- pit-stop decisions
- weather state
- race-control constraints
- incident and DNF pressure
- overtaking opportunities

## 4. Overtaking model

The pass model is still simplified, but it is no longer a pure ranking modifier.

It uses:

- time gap to the car ahead
- relative pace edge
- overtaking ability
- deployment strength
- tire delta
- track overtaking difficulty
- restart state
- weather and track-position pressure

That means Monaco, Monza, Spa, and Singapore now behave differently because overtaking is resolved inside the race flow rather than after the fact.

## 5. Tire and pit logic

Tire behavior now evolves across laps through:

- compound baseline
- age
- wear accumulation
- circuit tire stress
- weather mismatch
- driver tire management
- strategy tire load

Pit stops can happen because of:

- planned windows
- tire cliff
- weather crossover
- VSC / safety car opportunity
- late-window recovery

This is still not a full optimizer, but strategy now succeeds or fails inside the race rather than as a single static bonus.

## 6. Event engine

The event engine now generates race timelines instead of only race-wide flags.

It can produce:

- wet starts
- weather-shift laps
- drying phases
- VSC windows
- safety-car windows
- red flags
- late incidents
- restart laps

Those events feed directly into lap-time evolution, field compression, and pit timing.

## 7. Monte Carlo aggregation

The simulator still uses Monte Carlo sampling, but each run is now a full lap-by-lap race.

Aggregation produces:

- win probability
- podium probability
- top-10 probability
- expected finish
- expected points
- DNF probability
- expected stop count
- average first pit lap
- average overtakes
- average stint length
- event frequencies
- likely race turning points

## 8. Data posture

The current release uses real 2026 Formula 1 entities:

- teams
- drivers
- Grands Prix
- circuit names
- Sprint weekends

It still uses modeled priors for:

- team pace assumptions
- driver pace assumptions
- circuit behavior weights
- event priors

That keeps the app usable now while leaving room for real FIA timing and event ingestion later.

## Current realism boundary

The current build is much closer to race flow than the original aggregate model, but it is still bounded:

- no sector-level timing
- no corner-by-corner pass model
- no full qualifying session engine yet
- no full Sprint-race simulation yet
- no official telemetry ingestion

Those are the next realism steps, not hidden limitations.
