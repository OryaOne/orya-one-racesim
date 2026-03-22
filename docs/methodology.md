# Methodology

## Purpose

Orya One RaceSim is a hybrid 2026 Formula 1 simulation project. The idea is simple: learn the pace prior, keep the race mechanics explicit, and use probabilistic events where certainty would be fake.

## Modeling structure

The simulator separates three kinds of logic:

1. learned pace prior
2. explicit race and strategy logic
3. probabilistic race-control uncertainty

That boundary is deliberate and shows up across the whole codebase.

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

Important boundary:

- the model does not predict finishing order directly
- it only supplies the starting pace signal for the wider race simulation

## 2. Explicit race logic

The deterministic layer handles what should stay visible:

- qualifying leverage
- tire degradation
- pit-loss cost
- fuel sensitivity
- reliability pressure
- team pit efficiency
- deployment sensitivity
- strategy-template interactions

For the 2026 release, the race logic also introduces circuit-specific deployment and active-aero framing where it matters, especially on tracks such as Monza, Baku, Shanghai, and Las Vegas.

## 3. Strategy engine

The strategy engine scores plans against:

- qualifying importance
- track-position pressure
- tire stress
- safety-car pressure
- weather risk
- Sprint-weekend context
- deployment sensitivity
- driver traits such as tire management, consistency, and energy management

The strategy layer is still abstract, but it is structured so it can become more realistic without changing the surrounding app.

## 4. Event engine

The event engine introduces controlled uncertainty through:

- wet starts
- weather shifts
- yellow flags
- VSCs
- safety cars
- red flags
- incidents
- DNFs
- late-race disruptions

Those events influence:

- degradation pressure
- pit-stop value
- overtaking bandwidth
- deployment pressure
- finish-position variance

## 5. Monte Carlo aggregation

Each request resolves many independent races and aggregates:

- expected finish
- finish distributions
- win probability
- podium probability
- points probability
- expected points
- DNF probability
- strategy success
- team-level outlook
- race-control impact

The output should be read as a probability map for the configured weekend, not as a single deterministic prediction.

## 6. Data posture

The current release uses real 2026 Formula 1 entities:

- teams
- drivers
- Grands Prix
- circuit names
- Sprint weekends

The current release also uses modeled priors:

- team pace assumptions
- driver performance assumptions
- circuit behavior weights
- event priors

This keeps the app immediately usable while making it clear what is factual season structure and what is simulator input.

## Current MVP simplifications

The current build is still intentionally bounded:

- race resolution is event-aware and stint-aware rather than full lap-by-lap
- qualifying influence is part of race performance rather than a separate session engine
- deployment and active-aero behavior are represented as scenario weights instead of detailed system simulation
- points and Sprint handling are weekend-aware, but still simplified

## Likely next steps

- standalone qualifying and Q3 probability outputs
- deeper Sprint-weekend handling
- richer lap-window weather and crossover logic
- pit-stop optimization
- calibration against historical Formula 1 data
- teammate interactions and team-order constraints
