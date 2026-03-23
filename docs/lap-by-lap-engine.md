# Lap-by-Lap Engine Notes

This document describes the current race-resolution path used by Orya One RaceSim.

## Runtime summary

The app no longer resolves a Grand Prix from one synthetic driver score. Each Monte Carlo sample now runs a full lap-by-lap race.

Main path:

1. `SimulationService.simulate()`
2. build static driver profiles
3. create `LapRaceEngine`
4. run `simulate_run()` for each Monte Carlo sample
5. aggregate finish positions, pit behavior, overtakes, and event outcomes

## Core state objects

The shared race-state dataclasses live in `packages/sim-core/src/racesim/sim/state.py`.

Important ones:

- `DriverStaticProfile`
- `DriverRaceState`
- `PitStopRecord`
- `DriverDiagnosticsAccumulator`
- `DriverRunSummary`
- `RaceRunResult`

## What happens in one race run

### Grid formation

The run starts with a qualifying-shaped grid:

- qualifying leverage
- pace edge
- track fit
- strategy qualifying bias
- random qualifying spread

This creates a starting order instead of assuming the race begins from the final expected ranking.

### Event timeline

`events.py` generates a race timeline for the run:

- wet start or dry start
- optional weather-shift lap
- optional drying lap
- VSC windows
- safety-car windows
- red flag windows
- restart laps
- late-race incident pressure

### Per-lap update

Every lap updates:

- base lap time
- fuel penalty
- tire penalty
- energy benefit / shortfall
- traffic penalty
- track-evolution bonus
- weather effect
- pit-stop timing
- incident / damage pressure
- overtaking opportunities

### Pit stops

A stop can happen because of:

- planned strategy window
- tire cliff
- weather crossover
- safety-car / VSC opportunity
- late-window recovery

Pit records store:

- lap
- compound out
- compound in
- reason
- stationary time
- total loss

### Overtaking

The pass model evaluates the follower against the car ahead using:

- current time gap
- relative pace edge
- overtaking ability
- deployment strength
- tire delta
- strategy aggression
- track overtaking difficulty
- weather
- restart state

This is still a lap-level abstraction, but it is materially different from adding a static overtake bonus before sorting the final result.

## Aggregated outputs

The engine now produces race-flow outputs the old model could not support cleanly:

- expected stop count
- average first pit lap
- average overtakes
- average stint length
- net position delta
- average safety-car lap
- average pit stops per driver
- likely turning points

## Performance choices

To keep the app interactive:

- the engine runs at lap resolution, not sector resolution
- pass checks focus on nearby cars
- weather uses a simple wetness curve
- race-control bunching is compact rather than fully procedural

That keeps the runtime usable while still making the race result emerge from progression instead of static ranking.

## What still needs work

- sector-level or corner-level race state
- richer restart model
- more detailed tire compound differences
- qualifying and Sprint as separate weekend sessions
- calibration from official FIA race history
