# Data Model

The repository now ships with a real 2026 Formula 1 season structure and modeled performance priors on top of it.

That means two things are true at once:

- the teams, drivers, Grands Prix, circuit names, and Sprint weekends are real 2026 entities
- the pace, strategy, circuit-behavior, and event weights are still simulator inputs

## Design goals

The data layer is designed to:

- make the app runnable immediately
- separate factual season structure from modeled priors
- keep fields clear enough to replace later with richer data
- avoid copyrighted logos or official visual assets

## Files and purpose

### `data/drivers/teams.json`

Team-level metadata for the 2026 grid.

Key fields:

- `name`
- `pit_crew_efficiency`
- `reliability_base`
- `race_pace`
- `qualifying_pace`
- `energy_efficiency`

### `data/drivers/drivers.json`

Driver-level priors for the 2026 grid.

Key fields:

- `team_id`
- `car_number`
- `recent_form`
- `qualifying_strength`
- `tire_management`
- `overtaking`
- `consistency`
- `aggression`
- `energy_management`
- `wet_weather_skill`
- `reliability`

### `data/tracks/grands_prix.json`

The 2026 Grand Prix calendar plus circuit behavior metadata.

Key fields:

- `calendar_round`
- `circuit_name`
- `circuit_type`
- `sprint_weekend`
- `homologation_note`
- `overtaking_difficulty`
- `tire_stress`
- `pit_loss_seconds`
- `track_position_importance`
- `qualifying_importance`
- `weather_volatility`
- `safety_car_risk`
- `strategy_flexibility`
- `energy_sensitivity`
- `degradation_profile`

### `data/strategies/strategy_templates.json`

Abstract Formula 1-style strategy templates.

Key fields:

- `compound_sequence`
- `pit_windows`
- `aggression`
- `flexibility`
- `track_position_bias`
- `qualifying_bias`
- `energy_bias`
- `safety_car_bias`
- `weather_adaptability`

### `data/weather/weather_event_priors.json`

Weekend weather and race-control presets used to seed event generation.

Key fields:

- `dry_bias`
- `rain_onset_probability`
- `track_evolution`
- `temperature_variation`
- `yellow_flag_probability`
- `vsc_probability`
- `safety_car_probability`
- `red_flag_probability`
- `dnf_probability`

### `data/model/training_samples.csv`

Synthetic tabular samples used for the pace model.

This file is still synthetic even though the main season catalog is now real 2026 Formula 1 structure.

## What is factual vs modeled

Factual season structure:

- the 2026 teams
- the 2026 drivers
- the 2026 Grand Prix calendar
- circuit naming
- Sprint-weekend flagging

Modeled simulator inputs:

- performance priors
- circuit pressure weights
- event probabilities
- strategy scores

## Replacement path

If the project moves to richer data later, the most natural path is:

1. keep the current field contracts where possible
2. replace estimated priors with normalized real-world inputs
3. retrain the pace model on upgraded feature tables
4. calibrate deterministic and event logic against historical race outcomes

## Canonical field reference

The detailed field-level schema reference lives in `data/schemas/catalog.json`.
