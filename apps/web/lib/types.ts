export type TeamProfile = {
  id: string;
  name: string;
  color: string;
  pit_crew_efficiency: number;
  reliability_base: number;
  race_pace: number;
  qualifying_pace: number;
  energy_efficiency: number;
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
  energy_management: number;
  wet_weather_skill: number;
  reliability: number;
};

export type TrackProfile = {
  id: string;
  name: string;
  circuit_name: string;
  country: string;
  calendar_round: number;
  circuit_type: string;
  sprint_weekend: boolean;
  homologation_note?: string | null;
  laps: number;
  lap_length_km: number;
  base_race_time_sec: number;
  overtaking_difficulty: number;
  tire_stress: number;
  fuel_sensitivity: number;
  pit_loss_seconds: number;
  track_position_importance: number;
  qualifying_importance: number;
  weather_volatility: number;
  surface_evolution: number;
  safety_car_risk: number;
  strategy_flexibility: number;
  energy_sensitivity: number;
  degradation_profile: string;
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
  qualifying_bias: number;
  energy_bias: number;
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
  energy_deployment_weight: number;
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
  energy_deployment_intensity: number;
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
  points_probability: number;
  dnf_probability: number;
  expected_points: number;
  strategy_success_rate: number;
  uncertainty_index: number;
  confidence_label: "Stable" | "Measured" | "Exposed" | "High Variance";
  scenario_sensitivity: number;
  event_exposure: number;
  strategy_fit_score: number;
  expected_pace_score: number;
  expected_grid_position: number;
  expected_stop_count: number;
  average_first_pit_lap?: number | null;
  average_overtakes: number;
  average_stint_length: number;
  average_position_changes: number;
  net_position_delta: number;
  primary_stint_path: string[];
  primary_stint_lengths: number[];
  alternate_stint_path: string[];
  alternate_stint_lengths: number[];
  first_pit_window_start?: number | null;
  first_pit_window_end?: number | null;
  explanation: string[];
  position_distribution: PositionProbability[];
  diagnostics: Record<string, number>;
};

export type CircuitDiagnostics = {
  circuit_type: string;
  degradation_profile: string;
  track_position_importance: number;
  overtaking_difficulty: number;
  qualifying_importance: number;
  tire_stress: number;
  safety_car_risk: number;
  weather_volatility: number;
  energy_sensitivity: number;
  strategy_flexibility: number;
  track_position_multiplier: number;
  qualifying_carryover_factor: number;
  dirty_air_factor: number;
  overtake_suppression_factor: number;
  degradation_factor: number;
  pit_window_pressure_factor: number;
  disruption_leverage_factor: number;
  restart_factor: number;
  weather_sensitivity_factor: number;
  deployment_sensitivity_factor: number;
  strategy_flex_factor: number;
  recovery_factor: number;
  clean_air_factor: number;
  order_lock_factor: number;
  undercut_factor: number;
  alternate_strategy_factor: number;
  disruption_reshuffle_factor: number;
};

export type StopCountDistribution = {
  stops: number;
  share: number;
};

export type StrategyDiagnostics = {
  avg_position_changes_per_driver: number;
  avg_first_stop_lap?: number | null;
  avg_stop_count: number;
  first_stop_window_start?: number | null;
  first_stop_window_end?: number | null;
  undercut_success_tendency: number;
  overcut_success_tendency: number;
  traffic_penalty_impact: number;
  post_pit_traffic_penalty: number;
  avg_post_pit_position_delta: number;
  pit_timing_regret: number;
  strategy_success_rate: number;
  strategy_sensitivity_index: number;
  stop_count_distribution: StopCountDistribution[];
};

export type MovementSummary = {
  avg_overtakes_per_simulation: number;
  avg_position_changes_per_driver: number;
  race_fluidity_score: number;
  overtaking_intensity: "Sticky" | "Measured" | "Active" | "High Flow";
};

export type EventTimingSummary = {
  disruption_window_start?: number | null;
  disruption_window_end?: number | null;
  average_disruption_lap?: number | null;
  weather_crossover_window_start?: number | null;
  weather_crossover_window_end?: number | null;
  average_weather_shift_lap?: number | null;
  average_neutralized_pit_gain: number;
  safety_car_leverage_score: number;
  leverage_phase: string;
  late_race_interruption_risk: number;
};

export type RacePhaseSummary = {
  phase_id: "opening" | "first-stop" | "transition" | "closing";
  label: string;
  start_lap: number;
  end_lap: number;
  volatility: number;
  pit_pressure: number;
  overtake_load: number;
  summary: string;
};

export type TeamSummary = {
  team_id: string;
  team_name: string;
  avg_expected_finish: number;
  expected_points: number;
  combined_win_probability: number;
  combined_podium_probability: number;
};

export type CalibrationMetricsSummary = {
  weekends_covered: number;
  winner_hit_rate: number;
  podium_overlap_rate: number;
  avg_finish_mae: number;
  avg_stop_count_mae: number;
  avg_track_behavior_error: number;
};

export type ProvenanceSummary = {
  official_sources: string[];
  normalized_datasets: string[];
  modeled_inputs: string[];
  calibrated_layers: string[];
  live_assumptions: string[];
};

export type ScenarioTrustSummary = {
  confidence_tier: "High confidence" | "Moderate confidence" | "Experimental / Low confidence";
  historical_support_tier: "Strong support" | "Moderate support" | "Limited support";
  calibration_depth_tier: "Deep calibration" | "Established calibration" | "Limited calibration";
  volatility_tier: "Stable" | "Variable" | "High-chaos";
  data_grounding_tier: "Grounded" | "Partially grounded" | "Modeled-heavy";
  confidence_score: number;
  historical_support_score: number;
  calibration_depth_score: number;
  data_grounding_score: number;
  confidence_summary: string;
  calibration_notes: string[];
  support_notes: string[];
  coverage_notes: string[];
  experimental_flag: boolean;
  provenance: ProvenanceSummary;
  backtest_summary: CalibrationMetricsSummary;
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
  avg_pit_stops_per_driver: number;
  avg_green_flag_overtakes: number;
  avg_safety_car_lap?: number | null;
  turning_points: string[];
  circuit_diagnostics: CircuitDiagnostics;
  strategy_diagnostics: StrategyDiagnostics;
  movement_summary: MovementSummary;
  event_timing: EventTimingSummary;
  race_phases: RacePhaseSummary[];
  evolution_summary: string[];
};

export type ScenarioSummary = {
  grand_prix_id: string;
  grand_prix_name: string;
  weather_preset_id: string;
  weather_preset_name: string;
  simulation_engine: "lap-by-lap";
  simulation_runs: number;
  complexity_level: string;
  sprint_weekend: boolean;
  headline: string;
  strategy_outlook: string;
  event_outlook: string;
  confidence_note: string;
  trust_summary: ScenarioTrustSummary;
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
