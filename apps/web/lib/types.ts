export type TeamProfile = {
  id: string;
  name: string;
  color: string;
  pit_crew_efficiency: number;
  reliability_base: number;
};

export type DriverProfile = {
  id: string;
  name: string;
  team_id: string;
  car_number: number;
  recent_form: number;
  qualifying_strength: number;
  tire_management: number;
  overtaking: number;
  consistency: number;
  aggression: number;
  wet_weather_skill: number;
  reliability: number;
};

export type TrackProfile = {
  id: string;
  name: string;
  country: string;
  laps: number;
  lap_length_km: number;
  base_race_time_sec: number;
  overtaking_difficulty: number;
  tire_stress: number;
  fuel_sensitivity: number;
  pit_loss_seconds: number;
  track_position_importance: number;
  weather_volatility: number;
  surface_evolution: number;
  summary: string;
};

export type StrategyTemplate = {
  id: string;
  name: string;
  description: string;
  compound_sequence: string[];
  pit_windows: number[];
  aggression: number;
  flexibility: number;
  tire_load: number;
  track_position_bias: number;
  safety_car_bias: number;
  weather_adaptability: number;
};

export type WeatherPreset = {
  id: string;
  label: string;
  dry_bias: number;
  rain_onset_probability: number;
  track_evolution: number;
  temperature_variation: number;
  yellow_flag_probability: number;
  vsc_probability: number;
  safety_car_probability: number;
  red_flag_probability: number;
  dnf_probability: number;
};

export type DefaultsPayload = {
  drivers: DriverProfile[];
  teams: TeamProfile[];
  grands_prix: TrackProfile[];
  strategy_templates: StrategyTemplate[];
  weather_presets: WeatherPreset[];
};

export type SimulationWeights = {
  tire_wear_weight: number;
  fuel_effect_weight: number;
  driver_form_weight: number;
  qualifying_importance: number;
  overtaking_sensitivity: number;
  pit_stop_delta_sensitivity: number;
  stochastic_variance: number;
  reliability_sensitivity: number;
};

export type EnvironmentControls = {
  dry_race: number;
  mixed_conditions: number;
  rain_onset: number;
  track_evolution: number;
  temperature_variation: number;
  crashes: number;
  dnfs: number;
  yellow_flags: number;
  virtual_safety_cars: number;
  full_safety_cars: number;
  red_flags: number;
  late_race_incidents: number;
  randomness_intensity: number;
};

export type DriverOverride = {
  driver_id: string;
  recent_form_delta: number;
  qualifying_delta: number;
  tire_management_delta: number;
  overtaking_delta: number;
  consistency_delta: number;
  aggression_delta: number;
};

export type StrategySuggestion = {
  driver_id: string;
  strategy_id: string;
  strategy_name: string;
  score: number;
  risk_profile: "Low" | "Balanced" | "Assertive" | "High Variance";
  rationale: string[];
  tradeoff: string;
};

export type PositionProbability = {
  position: number;
  probability: number;
};

export type DriverResult = {
  driver_id: string;
  driver_name: string;
  team_id: string;
  team_name: string;
  assigned_strategy_id: string;
  assigned_strategy_name: string;
  expected_finish_position: number;
  win_probability: number;
  podium_probability: number;
  top_10_probability: number;
  dnf_probability: number;
  strategy_success_rate: number;
  uncertainty_index: number;
  confidence_label: "Stable" | "Measured" | "Exposed" | "High Variance";
  scenario_sensitivity: number;
  event_exposure: number;
  strategy_fit_score: number;
  expected_pace_score: number;
  explanation: string[];
  position_distribution: PositionProbability[];
};

export type TeamSummary = {
  team_id: string;
  team_name: string;
  avg_expected_finish: number;
  combined_win_probability: number;
  combined_podium_probability: number;
};

export type EventSummary = {
  weather_shift_rate: number;
  yellow_flag_rate: number;
  vsc_rate: number;
  safety_car_rate: number;
  red_flag_rate: number;
  dnf_rate: number;
  late_incident_rate: number;
  volatility_index: number;
  dominant_factor: string;
  impact_summary: string[];
};

export type ScenarioSummary = {
  grand_prix_id: string;
  grand_prix_name: string;
  weather_preset_id: string;
  weather_preset_name: string;
  simulation_runs: number;
  complexity_level: string;
  headline: string;
  strategy_outlook: string;
  event_outlook: string;
  confidence_note: string;
};

export type SimulationResponse = {
  scenario: ScenarioSummary;
  drivers: DriverResult[];
  team_summary: TeamSummary[];
  event_summary: EventSummary;
  strategy_suggestions: StrategySuggestion[];
};

export type SimulationFormState = {
  grand_prix_id: string;
  weather_preset_id: string;
  simulation_runs: number;
  complexity_level: "low" | "balanced" | "high";
  field_strategy_preset: string;
  weights: SimulationWeights;
  environment: EnvironmentControls;
  strategies: Record<string, string>;
  driver_overrides: DriverOverride[];
};
