"use client";

import type { ComponentType, ReactNode } from "react";
import { startTransition, useDeferredValue, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CloudRain,
  Flag,
  Gauge,
  Loader2,
  Radar,
  ShieldAlert,
  SlidersHorizontal,
  Target,
  Thermometer,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchDefaults, fetchSuggestions, runSimulation } from "@/lib/api";
import type {
  DefaultsPayload,
  DriverOverride,
  DriverResult,
  SimulationFormState,
  SimulationResponse,
  StrategySuggestion,
} from "@/lib/types";

const defaultWeights = {
  tire_wear_weight: 0.72,
  fuel_effect_weight: 0.55,
  driver_form_weight: 0.68,
  qualifying_importance: 0.74,
  overtaking_sensitivity: 0.57,
  energy_deployment_weight: 0.66,
  pit_stop_delta_sensitivity: 0.61,
  stochastic_variance: 0.52,
  reliability_sensitivity: 0.46,
};

const defaultEnvironment = {
  dry_race: 0.74,
  mixed_conditions: 0.28,
  rain_onset: 0.22,
  track_evolution: 0.58,
  temperature_variation: 0.44,
  energy_deployment_intensity: 0.62,
  crashes: 0.16,
  dnfs: 0.1,
  yellow_flags: 0.21,
  virtual_safety_cars: 0.15,
  full_safety_cars: 0.14,
  red_flags: 0.04,
  late_race_incidents: 0.12,
  randomness_intensity: 0.5,
};

const DEMO_PRESETS = [
  {
    id: "spa-weather-swing",
    label: "Spa weather swing",
    description: "A mixed-condition Spa run with crossover timing, safety-car risk, and a wide strategy range.",
    grand_prix_id: "belgian-grand-prix",
    weather_preset_id: "rain-crossover-threat",
    simulation_runs: 1200,
    complexity_level: "high" as const,
    field_strategy_preset: "",
    weights: {
      ...defaultWeights,
      tire_wear_weight: 0.78,
      overtaking_sensitivity: 0.63,
      energy_deployment_weight: 0.71,
      stochastic_variance: 0.58,
    },
    environment: {
      ...defaultEnvironment,
      rain_onset: 0.41,
      yellow_flags: 0.29,
      virtual_safety_cars: 0.22,
      full_safety_cars: 0.21,
      red_flags: 0.07,
      late_race_incidents: 0.2,
      randomness_intensity: 0.62,
      track_evolution: 0.63,
      temperature_variation: 0.56,
      energy_deployment_intensity: 0.68,
      crashes: 0.22,
    },
  },
  {
    id: "monaco-track-position",
    label: "Monaco track position",
    description: "A qualifying-led Monaco setup where pit loss and clean air matter more than passing volume.",
    grand_prix_id: "monaco-grand-prix",
    weather_preset_id: "dry-baseline",
    simulation_runs: 900,
    complexity_level: "balanced" as const,
    field_strategy_preset: "qualifying-track-position",
    weights: {
      ...defaultWeights,
      qualifying_importance: 0.9,
      pit_stop_delta_sensitivity: 0.68,
      overtaking_sensitivity: 0.38,
      stochastic_variance: 0.44,
    },
    environment: {
      ...defaultEnvironment,
      rain_onset: 0.08,
      yellow_flags: 0.18,
      full_safety_cars: 0.12,
      randomness_intensity: 0.4,
    },
  },
  {
    id: "monza-deployment-attack",
    label: "Monza deployment attack",
    description: "A low-drag Monza scenario that pushes energy deployment, overtaking windows, and undercut aggression.",
    grand_prix_id: "italian-grand-prix",
    weather_preset_id: "dry-baseline",
    simulation_runs: 1000,
    complexity_level: "balanced" as const,
    field_strategy_preset: "",
    weights: {
      ...defaultWeights,
      fuel_effect_weight: 0.58,
      overtaking_sensitivity: 0.7,
      energy_deployment_weight: 0.88,
      pit_stop_delta_sensitivity: 0.57,
    },
    environment: {
      ...defaultEnvironment,
      track_evolution: 0.54,
      energy_deployment_intensity: 0.82,
      temperature_variation: 0.33,
      randomness_intensity: 0.46,
    },
  },
];

const tooltipStyle = {
  backgroundColor: "rgba(8, 10, 14, 0.96)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: 12,
  color: "#f4f6f8",
} as const;

const distributionColors = ["#e12944", "#c4cbd3", "#f6b43f", "#27c07d", "#ff875f", "#6f7b89"];

function buildInitialOverrides(driverIds: string[]): DriverOverride[] {
  return driverIds.map((driverId) => ({
    driver_id: driverId,
    recent_form_delta: 0,
    qualifying_delta: 0,
    tire_management_delta: 0,
    overtaking_delta: 0,
    consistency_delta: 0,
    aggression_delta: 0,
  }));
}

function buildInitialForm(defaults: DefaultsPayload): SimulationFormState {
  const preset = DEMO_PRESETS[0];
  return {
    grand_prix_id: defaults.grands_prix.find((item) => item.id === preset.grand_prix_id)?.id ?? defaults.grands_prix[0]?.id ?? "",
    weather_preset_id:
      defaults.weather_presets.find((item) => item.id === preset.weather_preset_id)?.id ?? defaults.weather_presets[0]?.id ?? "",
    simulation_runs: preset.simulation_runs,
    complexity_level: preset.complexity_level,
    field_strategy_preset: preset.field_strategy_preset,
    weights: preset.weights,
    environment: preset.environment,
    strategies: {},
    driver_overrides: buildInitialOverrides(defaults.drivers.map((driver) => driver.id)),
  };
}

function applyDemoPreset(
  defaults: DefaultsPayload,
  currentForm: SimulationFormState,
  presetId: string,
): SimulationFormState {
  const preset = DEMO_PRESETS.find((item) => item.id === presetId) ?? DEMO_PRESETS[0];
  return {
    ...currentForm,
    grand_prix_id: defaults.grands_prix.find((item) => item.id === preset.grand_prix_id)?.id ?? currentForm.grand_prix_id,
    weather_preset_id:
      defaults.weather_presets.find((item) => item.id === preset.weather_preset_id)?.id ?? currentForm.weather_preset_id,
    simulation_runs: preset.simulation_runs,
    complexity_level: preset.complexity_level,
    field_strategy_preset: preset.field_strategy_preset,
    weights: preset.weights,
    environment: preset.environment,
    strategies: {},
    driver_overrides: buildInitialOverrides(defaults.drivers.map((driver) => driver.id)),
  };
}

function formatPct(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

function formatSigned(value: number) {
  if (value > 0) {
    return `+${value}`;
  }
  return String(value);
}

function hasUnknownDriverIds(
  defaults: DefaultsPayload,
  payload: Array<{ driver_id: string }>,
) {
  const knownIds = new Set(defaults.drivers.map((driver) => driver.id));
  return payload.some((item) => !knownIds.has(item.driver_id));
}

function badgeVariantForConfidence(value: DriverResult["confidence_label"]) {
  if (value === "Stable") {
    return "success";
  }
  if (value === "Measured") {
    return "muted";
  }
  return "warning";
}

function badgeVariantForRisk(value: StrategySuggestion["risk_profile"]) {
  if (value === "Low") {
    return "success";
  }
  if (value === "Balanced") {
    return "muted";
  }
  return "warning";
}

function sliderLabel(value: number) {
  if (value < 0.25) {
    return "Low";
  }
  if (value < 0.5) {
    return "Measured";
  }
  if (value < 0.75) {
    return "Elevated";
  }
  return "High";
}

function ControlSection({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <Card className="border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-primary">{eyebrow}</div>
            <CardTitle className="mt-3 text-xl">{title}</CardTitle>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-primary/15 bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-[12px] border border-white/10 bg-[#090c11] px-4 py-3 text-sm text-white outline-none transition focus:border-primary/60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SliderField({
  label,
  value,
  onChange,
  description,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  description: string;
}) {
  return (
    <label className="rounded-[14px] border border-white/8 bg-black/20 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm text-white">{label}</span>
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <span>{sliderLabel(value)}</span>
          <span>{value.toFixed(2)}</span>
        </div>
      </div>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#e12944]"
      />
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p>
    </label>
  );
}

function MetricPanel({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025),rgba(255,255,255,0.01))]">
      <CardContent className="p-5">
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</div>
        <div className="mt-3 font-display text-[2rem] leading-none text-white">{value}</div>
        <div className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

function DriverTable({ drivers }: { drivers: DriverResult[] }) {
  return (
    <div className="overflow-x-auto rounded-[18px] border border-white/8">
      <div className="min-w-[980px]">
        <div className="grid grid-cols-[56px_1.8fr_1.2fr_repeat(7,minmax(82px,1fr))] gap-3 bg-white/[0.04] px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>Pos</span>
          <span>Driver</span>
          <span>Strategy</span>
          <span>Win</span>
          <span>Podium</span>
          <span>Points</span>
          <span>DNF</span>
          <span>Fit</span>
          <span>Confidence</span>
          <span>Exp</span>
        </div>
        {drivers.map((driver, index) => (
          <div
            key={driver.driver_id}
            className="grid grid-cols-[56px_1.8fr_1.2fr_repeat(7,minmax(82px,1fr))] gap-3 border-t border-white/6 px-4 py-4 text-sm"
          >
            <div className="font-display text-xl text-white">{index + 1}</div>
            <div>
              <div className="font-medium text-white">{driver.driver_name}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {driver.team_name}
              </div>
              <div className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {driver.explanation[0]}
              </div>
            </div>
            <div>
              <div className="text-white">{driver.assigned_strategy_name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{formatPct(driver.strategy_success_rate)} fit</div>
            </div>
            <div>{formatPct(driver.win_probability)}</div>
            <div>{formatPct(driver.podium_probability)}</div>
            <div>{driver.expected_points.toFixed(1)}</div>
            <div>{formatPct(driver.dnf_probability)}</div>
            <div>{driver.strategy_fit_score.toFixed(1)}</div>
            <div>
              <Badge variant={badgeVariantForConfidence(driver.confidence_label)}>
                {driver.confidence_label}
              </Badge>
            </div>
            <div>P{driver.expected_finish_position.toFixed(1)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SimulatorWorkspace() {
  const [defaults, setDefaults] = useState<DefaultsPayload | null>(null);
  const [form, setForm] = useState<SimulationFormState | null>(null);
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [suggestions, setSuggestions] = useState<StrategySuggestion[]>([]);
  const [loadingDefaults, setLoadingDefaults] = useState(true);
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredSimulation = useDeferredValue(simulation);

  useEffect(() => {
    async function load() {
      try {
        const payload = await fetchDefaults<DefaultsPayload>();
        const initialForm = buildInitialForm(payload);
        setDefaults(payload);
        setForm(initialForm);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Failed to reach the API.");
      } finally {
        setLoadingDefaults(false);
      }
    }

    void load();
  }, []);

  useEffect(() => {
    if (!defaults || !form || suggestions.length > 0) {
      return;
    }
    const activeForm = form;
    async function hydrateSuggestions() {
      setLoadingSuggestions(true);
      try {
        const payload = await fetchSuggestions<StrategySuggestion[]>(activeForm);
        setSuggestions(payload);
      } catch {
        // A cold backend should not block the workspace from rendering.
      } finally {
        setLoadingSuggestions(false);
      }
    }
    void hydrateSuggestions();
  }, [defaults, form, suggestions.length]);

  async function requestSuggestions(
    activeForm: SimulationFormState = form as SimulationFormState,
    options?: { suppressError?: boolean },
  ) {
    if (!activeForm || !defaults) {
      return;
    }
    setLoadingSuggestions(true);
    if (!options?.suppressError) {
      setError(null);
    }
    try {
      const payload = await fetchSuggestions<StrategySuggestion[]>(activeForm);
      if (hasUnknownDriverIds(defaults, payload)) {
        throw new Error("The backend is still serving an older season catalog. Try again after the API redeploy completes.");
      }
      setSuggestions(payload);
    } catch (requestError) {
      if (!options?.suppressError) {
        setError(requestError instanceof Error ? requestError.message : "Failed to load strategy suggestions.");
      }
    } finally {
      setLoadingSuggestions(false);
    }
  }

  async function executeSimulation() {
    if (!form || !defaults) {
      return;
    }
    setLoadingSimulation(true);
    setError(null);
    try {
      const response = await runSimulation<SimulationResponse>(form);
      if (hasUnknownDriverIds(defaults, response.drivers)) {
        throw new Error("The backend is still on the old fictional grid. Redeploy the API before running 2026 race simulations.");
      }
      startTransition(() => {
        setSimulation(response);
        setSuggestions(response.strategy_suggestions);
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Simulation request failed.");
    } finally {
      setLoadingSimulation(false);
    }
  }

  if (loadingDefaults) {
    return (
      <div className="grid gap-6 lg:grid-cols-[430px_minmax(0,1fr)]">
        <Skeleton className="h-[1220px]" />
        <Skeleton className="h-[920px]" />
      </div>
    );
  }

  if (!defaults || !form) {
    return (
      <Card className="border-rose-400/20 bg-rose-950/20">
        <CardHeader>
          <CardTitle>2026 season data unavailable</CardTitle>
          <CardDescription>
            Start the FastAPI service on `http://localhost:8000` for local development, or set `API_URL` / `NEXT_PUBLIC_API_URL` so the frontend proxy can reach the 2026 Formula 1 backend.
          </CardDescription>
        </CardHeader>
        {error ? <CardContent className="text-sm text-rose-200">{error}</CardContent> : null}
      </Card>
    );
  }

  const activeTrack = defaults.grands_prix.find((item) => item.id === form.grand_prix_id) ?? defaults.grands_prix[0];
  const activeWeather =
    defaults.weather_presets.find((item) => item.id === form.weather_preset_id) ?? defaults.weather_presets[0];
  const deferredDrivers = deferredSimulation?.drivers ?? [];
  const leadDriver = deferredDrivers[0];
  const topDrivers = deferredDrivers.slice(0, 5);
  const eventData =
    deferredSimulation
      ? [
          { label: "Weather swing", value: deferredSimulation.event_summary.weather_shift_rate },
          { label: "Yellow flag", value: deferredSimulation.event_summary.yellow_flag_rate },
          { label: "Virtual SC", value: deferredSimulation.event_summary.vsc_rate },
          { label: "Safety car", value: deferredSimulation.event_summary.safety_car_rate },
          { label: "Red flag", value: deferredSimulation.event_summary.red_flag_rate },
          { label: "Late incident", value: deferredSimulation.event_summary.late_incident_rate },
        ]
      : [];
  const positionData =
    deferredSimulation?.drivers.slice(0, 8).map((driver) => ({
      name: driver.driver_name.split(" ")[0],
      expected: Number((defaults.drivers.length + 1 - driver.expected_finish_position).toFixed(2)),
      rawExpected: driver.expected_finish_position,
      win: Number((driver.win_probability * 100).toFixed(1)),
    })) ?? [];
  const topDistribution =
    deferredSimulation?.drivers.slice(0, 4).map((driver) => ({
      driver: driver.driver_name.split(" ")[0],
      ...Object.fromEntries(
        driver.position_distribution.slice(0, 6).map((item) => [
          `P${item.position}`,
          Number((item.probability * 100).toFixed(1)),
        ]),
      ),
    })) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[430px_minmax(0,1fr)] xl:grid-cols-[450px_minmax(0,1fr)]">
      <div className="space-y-6 lg:sticky lg:top-28 lg:h-[calc(100vh-9rem)] lg:overflow-auto lg:pr-2">
        <ControlSection
          eyebrow="01 · Grand Prix Weekend"
          title="Grand Prix and circuit setup"
          description="Choose a 2026 Formula 1 Grand Prix, review the circuit profile, and set the baseline weekend assumptions."
          icon={Gauge}
        >
          <div className="grid gap-3 md:grid-cols-3">
            {DEMO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  const next = applyDemoPreset(defaults, form, preset.id);
                  setForm(next);
                  void requestSuggestions(next);
                }}
                className="rounded-[14px] border border-white/8 bg-black/20 p-4 text-left transition hover:border-primary/30 hover:bg-white/[0.04]"
              >
                <div className="text-sm text-white">{preset.label}</div>
                <div className="mt-2 text-xs leading-5 text-muted-foreground">{preset.description}</div>
              </button>
            ))}
          </div>
          <div className="mt-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Demo race weekends</div>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              Use these presets to start from recognizable 2026 Formula 1 strategy patterns.
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Grand Prix"
              value={form.grand_prix_id}
              onChange={(value) => setForm({ ...form, grand_prix_id: value })}
              options={defaults.grands_prix.map((item) => ({ value: item.id, label: item.name }))}
            />
            <SelectField
              label="Race-weather preset"
              value={form.weather_preset_id}
              onChange={(value) => setForm({ ...form, weather_preset_id: value })}
              options={defaults.weather_presets.map((item) => ({ value: item.id, label: item.label }))}
            />
          </div>
          <div className="mt-4 rounded-[16px] border border-primary/12 bg-primary/8 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-primary">Circuit profile</div>
                <div className="mt-2 font-display text-2xl text-white">{activeTrack.name}</div>
                <div className="mt-1 text-sm text-muted-foreground">{activeTrack.circuit_name}</div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{activeTrack.summary}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="muted">{activeWeather.label}</Badge>
                {activeTrack.sprint_weekend ? <Badge variant="warning">Sprint weekend</Badge> : null}
              </div>
            </div>
            {activeTrack.homologation_note ? (
              <div className="mt-4 rounded-[12px] border border-amber-300/20 bg-amber-400/10 p-3 text-xs leading-5 text-amber-100">
                {activeTrack.homologation_note}
              </div>
            ) : null}
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-[12px] border border-white/8 bg-black/20 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Qualifying weight</div>
                <div className="mt-2 text-white">{Math.round(activeTrack.qualifying_importance * 100)}/100</div>
              </div>
              <div className="rounded-[12px] border border-white/8 bg-black/20 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Track position</div>
                <div className="mt-2 text-white">{Math.round(activeTrack.track_position_importance * 100)}/100</div>
              </div>
              <div className="rounded-[12px] border border-white/8 bg-black/20 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Energy demand</div>
                <div className="mt-2 text-white">{Math.round(activeTrack.energy_sensitivity * 100)}/100</div>
              </div>
              <div className="rounded-[12px] border border-white/8 bg-black/20 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Safety car risk</div>
                <div className="mt-2 text-white">{Math.round(activeTrack.safety_car_risk * 100)}/100</div>
              </div>
              <div className="rounded-[12px] border border-white/8 bg-black/20 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Deg profile</div>
                <div className="mt-2 text-white capitalize">{activeTrack.degradation_profile}</div>
              </div>
              <div className="rounded-[12px] border border-white/8 bg-black/20 p-3">
                <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Weather swing</div>
                <div className="mt-2 text-white">{Math.round(activeTrack.weather_volatility * 100)}/100</div>
              </div>
            </div>
          </div>
        </ControlSection>

        <ControlSection
          eyebrow="02 · Race Conditions"
          title="Race control and track conditions"
          description="Tune weather swings, deployment intensity, race-control risk, reliability pressure, and late-race incidents."
          icon={CloudRain}
        >
          <div className="grid gap-4">
            <SliderField
              label="Weather swing"
              value={form.environment.rain_onset}
              onChange={(value) => setForm({ ...form, environment: { ...form.environment, rain_onset: value } })}
              description="Raises the probability of a crossover window and wet-phase adaptation."
            />
            <SliderField
              label="Yellow flags"
              value={form.environment.yellow_flags}
              onChange={(value) => setForm({ ...form, environment: { ...form.environment, yellow_flags: value } })}
              description="Short local cautions that modestly shift strategy regret."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SliderField
                label="Energy deployment"
                value={form.environment.energy_deployment_intensity}
                onChange={(value) =>
                  setForm({ ...form, environment: { ...form.environment, energy_deployment_intensity: value } })
                }
                description="Raises how strongly 2026 deployment and active-aero transitions shape the race."
              />
              <SliderField
                label="Virtual safety car"
                value={form.environment.virtual_safety_cars}
                onChange={(value) =>
                  setForm({ ...form, environment: { ...form.environment, virtual_safety_cars: value } })
                }
                description="Partial neutralization with a moderate effect on pit timing and restart energy release."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SliderField
                label="Safety cars"
                value={form.environment.full_safety_cars}
                onChange={(value) =>
                  setForm({ ...form, environment: { ...form.environment, full_safety_cars: value } })
                }
                description="Compresses gaps and increases the value of reactive pit-wall calls."
              />
              <SliderField
                label="Retirement pressure"
                value={form.environment.dnfs}
                onChange={(value) => setForm({ ...form, environment: { ...form.environment, dnfs: value } })}
                description="Broad mechanical and incident retirement pressure."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SliderField
                label="Track evolution"
                value={form.environment.track_evolution}
                onChange={(value) =>
                  setForm({ ...form, environment: { ...form.environment, track_evolution: value } })
                }
                description="Rewards stable drivers as the surface builds grip through the race."
              />
              <SliderField
                label="Temperature swing"
                value={form.environment.temperature_variation}
                onChange={(value) =>
                  setForm({ ...form, environment: { ...form.environment, temperature_variation: value } })
                }
                description="Raises thermal pressure and shifts the tire-risk balance."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SliderField
                label="Incident pressure"
                value={form.environment.crashes}
                onChange={(value) => setForm({ ...form, environment: { ...form.environment, crashes: value } })}
                description="Local incident exposure that adds time loss and recoverable setbacks."
              />
              <SliderField
                label="Late-race incidents"
                value={form.environment.late_race_incidents}
                onChange={(value) =>
                  setForm({ ...form, environment: { ...form.environment, late_race_incidents: value } })
                }
                description="Adds late volatility when gaps and strategy pressure are tightest."
              />
            </div>
            <SliderField
              label="Race variance"
              value={form.environment.randomness_intensity}
              onChange={(value) =>
                setForm({ ...form, environment: { ...form.environment, randomness_intensity: value } })
              }
              description="Widens the finish range without replacing the baseline pace, strategy, and race-control logic."
            />
          </div>
        </ControlSection>

        <ControlSection
          eyebrow="03 · Strategy Wall"
          title="Stint strategy board"
          description="Blend a field preset with per-driver strategy calls and pit-wall recommendations."
          icon={Target}
        >
          <div className="grid gap-4">
            <SelectField
              label="Field stint preset"
              value={form.field_strategy_preset}
              onChange={(value) => setForm({ ...form, field_strategy_preset: value })}
              options={[{ value: "", label: "Use driver-specific / suggested mix" }].concat(
                defaults.strategy_templates.map((item) => ({ value: item.id, label: item.name })),
              )}
            />
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => void requestSuggestions()} disabled={loadingSuggestions}>
                {loadingSuggestions ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
                Refresh pit-wall recommendations
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const nextStrategies = { ...form.strategies };
                  for (const suggestion of suggestions) {
                    nextStrategies[suggestion.driver_id] = suggestion.strategy_id;
                  }
                  setForm({ ...form, field_strategy_preset: "", strategies: nextStrategies });
                }}
                disabled={!suggestions.length}
              >
                Apply recommended field
              </Button>
            </div>
            <div className="space-y-3">
              {suggestions.slice(0, 3).map((suggestion) => (
                <div key={suggestion.driver_id} className="rounded-[14px] border border-white/8 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-white">
                        {defaults.drivers.find((driver) => driver.id === suggestion.driver_id)?.name}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {suggestion.strategy_name}
                      </div>
                    </div>
                    <Badge variant={badgeVariantForRisk(suggestion.risk_profile)}>{suggestion.risk_profile}</Badge>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-muted-foreground">{suggestion.rationale[0]}</div>
                  <div className="mt-2 text-xs leading-5 text-muted-foreground">{suggestion.tradeoff}</div>
                </div>
              ))}
            </div>
          </div>
        </ControlSection>

        <ControlSection
          eyebrow="04 · Driver & Team"
          title="Driver and team assumptions"
          description="Adjust recent form, review team context, and assign driver-level race plans without flattening the underlying 2026 model."
          icon={Radar}
        >
          <div className="max-h-[420px] space-y-3 overflow-auto pr-1">
            {defaults.drivers.map((driver) => {
              const team = defaults.teams.find((item) => item.id === driver.team_id);
              const override = form.driver_overrides.find((item) => item.driver_id === driver.id);
              const suggestion = suggestions.find((item) => item.driver_id === driver.id);
              return (
                <div key={driver.id} className="rounded-[14px] border border-white/8 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-white">{driver.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {team?.name}
                      </div>
                    </div>
                    {suggestion ? (
                      <Badge variant={badgeVariantForRisk(suggestion.risk_profile)}>{suggestion.risk_profile}</Badge>
                    ) : null}
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2 text-xs text-muted-foreground">
                    <div>Qual {driver.qualifying_strength}</div>
                    <div>Tire {driver.tire_management}</div>
                    <div>Deploy {driver.energy_management}</div>
                    <div>Racecraft {driver.overtaking}</div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_110px]">
                    <select
                      value={form.strategies[driver.id] ?? ""}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          field_strategy_preset: "",
                          strategies: { ...form.strategies, [driver.id]: event.target.value },
                        })
                      }
                      className="rounded-[12px] border border-white/10 bg-[#090c11] px-4 py-3 text-sm text-white outline-none focus:border-primary/60"
                    >
                      <option value="">Suggested / pit-wall auto</option>
                      {defaults.strategy_templates.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={-15}
                      max={15}
                      step={1}
                      value={override?.recent_form_delta ?? 0}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          driver_overrides: form.driver_overrides.map((item) =>
                            item.driver_id === driver.id
                              ? { ...item, recent_form_delta: Number(event.target.value) }
                              : item,
                          ),
                        })
                      }
                      className="rounded-[12px] border border-white/10 bg-[#090c11] px-4 py-3 text-sm text-white outline-none focus:border-primary/60"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Recent form delta</span>
                    <span>{formatSigned(override?.recent_form_delta ?? 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </ControlSection>

        <ControlSection
          eyebrow="05 · Race Simulation"
          title="Race simulation settings"
          description="Set run depth and calibrate how strongly qualifying, tire wear, deployment, pit loss, and race pace influence the result."
          icon={SlidersHorizontal}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Simulation runs</span>
              <input
                type="number"
                min={50}
                max={5000}
                value={form.simulation_runs}
                onChange={(event) => setForm({ ...form, simulation_runs: Number(event.target.value) })}
                className="rounded-[12px] border border-white/10 bg-[#090c11] px-4 py-3 text-sm text-white outline-none focus:border-primary/60"
              />
            </label>
            <SelectField
              label="Simulation detail"
              value={form.complexity_level}
              onChange={(value) =>
                setForm({ ...form, complexity_level: value as SimulationFormState["complexity_level"] })
              }
              options={[
                { value: "low", label: "Low complexity" },
                { value: "balanced", label: "Balanced" },
                { value: "high", label: "High complexity" },
              ]}
            />
          </div>
          <div className="mt-4 grid gap-4">
            <SliderField
              label="Tire wear weight"
              value={form.weights.tire_wear_weight}
              onChange={(value) => setForm({ ...form, weights: { ...form.weights, tire_wear_weight: value } })}
              description="Emphasizes long-run tire degradation and stint discipline."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <SliderField
                label="Driver form weight"
                value={form.weights.driver_form_weight}
                onChange={(value) => setForm({ ...form, weights: { ...form.weights, driver_form_weight: value } })}
                description="Scales how strongly the pace prior carries through into the final forecast."
              />
              <SliderField
                label="Qualifying influence"
                value={form.weights.qualifying_importance}
                onChange={(value) =>
                  setForm({ ...form, weights: { ...form.weights, qualifying_importance: value } })
                }
                description="Controls how strongly Saturday pace carries into the race projection."
              />
              <SliderField
                label="Fuel sensitivity"
                value={form.weights.fuel_effect_weight}
                onChange={(value) => setForm({ ...form, weights: { ...form.weights, fuel_effect_weight: value } })}
                description="Raises the cost of aggressive pace on fuel-sensitive tracks."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SliderField
                label="Overtaking sensitivity"
                value={form.weights.overtaking_sensitivity}
                onChange={(value) =>
                  setForm({ ...form, weights: { ...form.weights, overtaking_sensitivity: value } })
                }
                description="Controls how much passing ability matters on the more open circuits."
              />
              <SliderField
                label="Energy deployment"
                value={form.weights.energy_deployment_weight}
                onChange={(value) =>
                  setForm({ ...form, weights: { ...form.weights, energy_deployment_weight: value } })
                }
                description="Controls how strongly the 2026 deployment model shapes pace and overtaking."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <SliderField
                label="Pit delta sensitivity"
                value={form.weights.pit_stop_delta_sensitivity}
                onChange={(value) =>
                  setForm({ ...form, weights: { ...form.weights, pit_stop_delta_sensitivity: value } })
                }
                description="Raises the strategic cost of extra stops and poor pit timing."
              />
              <SliderField
                label="Reliability sensitivity"
                value={form.weights.reliability_sensitivity}
                onChange={(value) =>
                  setForm({ ...form, weights: { ...form.weights, reliability_sensitivity: value } })
                }
                description="Amplifies how strongly reliability and event pressure weaken otherwise strong runs."
              />
            </div>
          </div>
        </ControlSection>

        <div className="space-y-3">
          <Button className="w-full" size="lg" onClick={() => void executeSimulation()} disabled={loadingSimulation}>
            {loadingSimulation ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Run Grand Prix simulation
          </Button>
          {error ? (
            <div className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}
          <div className="rounded-[14px] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
            Current weekend setup: <span className="text-white">{activeTrack.name}</span> in{" "}
            <span className="text-white">{activeWeather.label}</span>, with qualifying weight at{" "}
            <span className="text-white">{Math.round(activeTrack.qualifying_importance * 100)}</span> and deployment demand at{" "}
            <span className="text-white">{Math.round(activeTrack.energy_sensitivity * 100)}</span>.
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <Card className="overflow-hidden border-primary/10">
            <CardContent className="p-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-3xl">
                  <Badge>2026 Formula 1 race outcome projection</Badge>
                  <h2 className="mt-5 font-display text-[clamp(2.2rem,4.5vw,4.6rem)] leading-[0.96] tracking-[-0.04em] text-white">
                    Podium, points, and disruption outlook for the current Grand Prix setup.
                  </h2>
                  <p className="mt-4 text-base leading-7 text-muted-foreground">
                    Qualifying influence, tire degradation, deployment pressure, race control events, and Monte Carlo sampling are combined in one race projection.
                  </p>
                </div>
                <div className="rounded-[16px] border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Active Grand Prix</div>
                  <div className="mt-2 font-display text-2xl text-white">{activeTrack.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {activeTrack.circuit_name} · {activeWeather.label}
                  </div>
                </div>
              </div>
              {!deferredSimulation ? (
                <div className="mt-8 rounded-[18px] border border-dashed border-white/10 bg-black/20 p-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[14px] border border-primary/20 bg-primary/10">
                    <Radar className="h-6 w-6 text-primary" />
                  </div>
                  <div className="mt-5 font-display text-2xl text-white">Race projection will populate here</div>
                  <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Run the current Grand Prix setup to inspect finish distributions, points outlook, race-control risk, and driver notes grounded in the simulation outputs.
                  </p>
                </div>
              ) : (
                <div className="mt-8 grid gap-4 lg:grid-cols-4">
                  <MetricPanel
                    label="Projected winner"
                    value={leadDriver ? leadDriver.driver_name : "Pending"}
                    detail={leadDriver ? `${formatPct(leadDriver.win_probability)} win probability` : "Awaiting run"}
                  />
                  <MetricPanel
                    label="Projected points leader"
                    value={leadDriver ? leadDriver.expected_points.toFixed(1) : "Pending"}
                    detail={leadDriver ? `${formatPct(leadDriver.points_probability)} chance of scoring` : "Awaiting run"}
                  />
                  <MetricPanel
                    label="Race control pressure"
                    value={deferredSimulation.event_summary.dominant_factor}
                    detail={deferredSimulation.scenario.event_outlook}
                  />
                  <MetricPanel
                    label="Projection confidence"
                    value={leadDriver?.confidence_label ?? "Pending"}
                    detail={deferredSimulation.scenario.confidence_note}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </motion.section>

        {deferredSimulation ? (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Race weekend brief</CardTitle>
                  <CardDescription>{deferredSimulation.scenario.headline}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {deferredSimulation.scenario.sprint_weekend ? (
                    <div className="rounded-[16px] border border-amber-300/20 bg-amber-400/10 p-5">
                      <div className="text-[11px] uppercase tracking-[0.2em] text-amber-100">Sprint format</div>
                      <p className="mt-3 text-sm leading-6 text-amber-50/85">
                        This weekend uses the Sprint format, so qualifying leverage and parc ferme constraints carry more weight than usual.
                      </p>
                    </div>
                  ) : null}
                  <div className="rounded-[16px] border border-white/8 bg-black/20 p-5">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-primary">Strategy outlook</div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {deferredSimulation.scenario.strategy_outlook}
                    </p>
                  </div>
                  <div className="rounded-[16px] border border-white/8 bg-black/20 p-5">
                    <div className="text-[11px] uppercase tracking-[0.2em] text-primary">Race control outlook</div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {deferredSimulation.scenario.event_outlook}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Flag className="h-5 w-5 text-primary" />
                    <CardTitle>Race control and disruption summary</CardTitle>
                  </div>
                  <CardDescription>
                    What shaped the Grand Prix outcome most across the Monte Carlo runs, not just how often each event happened.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deferredSimulation.event_summary.impact_summary.map((item) => (
                    <div key={item} className="rounded-[14px] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
                      {item}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="h-5 w-5 text-primary" />
                    <CardTitle>Race control frequency</CardTitle>
                  </div>
                  <CardDescription>Observed frequency of weather swings, VSCs, safety cars, and late incidents.</CardDescription>
                </CardHeader>
                <CardContent className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={eventData}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="label" tick={{ fill: "#90a0b6", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} tick={{ fill: "#90a0b6", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(value: number) => formatPct(value)} contentStyle={tooltipStyle} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {eventData.map((entry) => (
                          <Cell
                            key={entry.label}
                            fill={
                              entry.label === "Safety car"
                                ? "#f6b43f"
                                : entry.label === "Red flag"
                                  ? "#ff6d4d"
                                  : entry.label === "Virtual SC"
                                    ? "#d7e14d"
                                    : entry.label === "Weather swing"
                                      ? "#9ba5b1"
                                      : "#e12944"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Thermometer className="h-5 w-5 text-primary" />
                    <CardTitle>Projected finishing order</CardTitle>
                  </div>
                  <CardDescription>Higher bar means a stronger expected finish relative to the full field.</CardDescription>
                </CardHeader>
                <CardContent className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={positionData} layout="vertical" margin={{ left: 16, right: 8 }}>
                      <CartesianGrid horizontal={false} stroke="rgba(255,255,255,0.08)" />
                      <XAxis type="number" tick={{ fill: "#90a0b6", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" tick={{ fill: "#dbe5f2", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        formatter={(_, __, payload) => `P${payload?.payload?.rawExpected?.toFixed?.(1) ?? "-"}`}
                        contentStyle={tooltipStyle}
                      />
                      <Bar dataKey="expected" radius={[0, 8, 8, 0]} fill="#e12944" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Expected finishing order</CardTitle>
                <CardDescription>
                  Probability-weighted finishing order with strategy fit, event load, and confidence notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DriverTable drivers={deferredDrivers} />
              </CardContent>
            </Card>

            <div className="grid gap-6 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Front-runner position distribution</CardTitle>
                  <CardDescription>
                    Position stacks for the leading projected group, capped at the first six finishing places.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topDistribution}>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                      <XAxis dataKey="driver" tick={{ fill: "#90a0b6", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#90a0b6", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={tooltipStyle} />
                      {["P1", "P2", "P3", "P4", "P5", "P6"].map((key, index) => (
                        <Bar
                          key={key}
                          dataKey={key}
                          stackId="a"
                          fill={distributionColors[index]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Race engineer notes</CardTitle>
                  <CardDescription>
                    Short reasoning blocks tied to pace, strategy fit, race control pressure, and confidence.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {topDrivers.map((driver) => (
                    <div key={driver.driver_id} className="rounded-[16px] border border-white/8 bg-black/20 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm text-white">{driver.driver_name}</div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {driver.team_name}
                          </div>
                        </div>
                        <Badge variant={badgeVariantForConfidence(driver.confidence_label)}>
                          {driver.confidence_label}
                        </Badge>
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                        <div className="rounded-[12px] border border-white/8 bg-white/[0.03] p-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Exp. finish</div>
                          <div className="mt-2 font-display text-2xl text-white">P{driver.expected_finish_position.toFixed(1)}</div>
                        </div>
                        <div className="rounded-[12px] border border-white/8 bg-white/[0.03] p-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Strategy fit</div>
                          <div className="mt-2 font-display text-2xl text-white">{driver.strategy_fit_score.toFixed(1)}</div>
                        </div>
                        <div className="rounded-[12px] border border-white/8 bg-white/[0.03] p-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Event load</div>
                          <div className="mt-2 font-display text-2xl text-white">{formatPct(driver.event_exposure)}</div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
                        {driver.explanation.map((reason) => (
                          <div key={reason}>• {reason}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Pit-wall strategy board</CardTitle>
                  <CardDescription>
                    Recommendations are scored against the same Grand Prix assumptions used by the simulation run.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {suggestions.slice(0, 6).map((suggestion) => (
                    <div key={suggestion.driver_id} className="rounded-[14px] border border-white/8 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm text-white">
                            {defaults.drivers.find((driver) => driver.id === suggestion.driver_id)?.name}
                          </div>
                          <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                            {suggestion.strategy_name}
                          </div>
                        </div>
                        <Badge variant={badgeVariantForRisk(suggestion.risk_profile)}>
                          {suggestion.risk_profile}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-1 text-sm leading-6 text-muted-foreground">
                        {suggestion.rationale.map((reason) => (
                          <div key={reason}>• {reason}</div>
                        ))}
                      </div>
                      <div className="mt-3 border-t border-white/8 pt-3 text-xs leading-5 text-muted-foreground">
                        {suggestion.tradeoff}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Constructors outlook</CardTitle>
                  <CardDescription>
                    Combined expected finish, points return, and outcome share at the team level.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {deferredSimulation.team_summary.map((team) => (
                    <div key={team.team_id} className="rounded-[16px] border border-white/8 bg-black/20 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm text-white">{team.team_name}</div>
                        <div className="font-display text-2xl text-white">P{team.avg_expected_finish.toFixed(1)}</div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-[12px] border border-white/8 bg-white/[0.03] p-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Expected points</div>
                          <div className="mt-2 text-white">{team.expected_points.toFixed(1)}</div>
                        </div>
                        <div className="rounded-[12px] border border-white/8 bg-white/[0.03] p-3">
                          <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Podium share</div>
                          <div className="mt-2 text-white">{formatPct(team.combined_podium_probability)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-primary" />
                <CardTitle>No Grand Prix projection yet</CardTitle>
              </div>
              <CardDescription>
                The board will show race-control impact, confidence notes, strategy fit, and finish distributions as soon as you run a simulation.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  );
}
