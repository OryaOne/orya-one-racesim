import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    title: "1. 2026 season catalog",
    text: "The app now uses the real 2026 Formula 1 teams, drivers, Grands Prix, and Sprint weekends. The performance and circuit priors layered on top of that catalog are estimated for the simulator and should be read as modeled inputs, not official timing data.",
  },
  {
    title: "2. Pace prior",
    text: "A compact PyTorch MLP predicts a baseline pace prior from driver and circuit features. It does not predict the finishing order on its own. It only supplies the starting pace signal for the wider race simulation.",
  },
  {
    title: "3. Deterministic race logic",
    text: "The explicit model handles qualifying weight, tire degradation, pit loss, fuel sensitivity, reliability pressure, and 2026-specific deployment and active-aero framing. Those assumptions stay visible on purpose.",
  },
  {
    title: "4. Race control and Monte Carlo",
    text: "Weather shifts, yellow flags, VSCs, safety cars, red flags, incidents, and DNFs are sampled repeatedly. The result is a probability distribution for the configured weekend, not a single hard forecast.",
  },
  {
    title: "5. Historical backtesting and calibration",
    text: "The simulator now includes an official-source-backed historical pipeline, normalized weekend schema, and backtesting workflow used to tune circuit leverage, strategy pressure, and race-control assumptions against a focused set of real Grands Prix.",
  },
  {
    title: "6. Trust and calibration layer",
    text: "Each scenario now carries an explicit trust summary: confidence tier, historical support tier, calibration depth, data grounding, and volatility. Those trust labels are derived from the current historical support basket, backtest coverage, and scenario complexity rather than from marketing-style certainty scores.",
  },
  {
    title: "7. Provenance separation",
    text: "The product keeps official source data, normalized historical datasets, modeled seed priors, calibrated parameters, and live user assumptions separate on purpose. The simulator does not present modeled assumptions as if they were official FIA / Formula 1 facts.",
  },
];

const provenanceLayers = [
  {
    title: "Official source data",
    tone: "success",
    text: "Formula 1 result pages, starting grids / qualifying pages, and pit-stop summaries used in the historical pipeline.",
  },
  {
    title: "Normalized historical data",
    tone: "info",
    text: "Project-shaped historical weekend files with explicit provenance tags for derived weather and neutralization markers.",
  },
  {
    title: "Modeled priors",
    tone: "warning",
    text: "2026 pace priors, weather/disruption assumptions, and user-entered setup levers used to simulate scenarios that are not directly observed.",
  },
  {
    title: "Calibrated layers",
    tone: "default",
    text: "Circuit leverage, overtaking, strategy pressure, and event logic tuned against the current historical subset and backtest reports.",
  },
];

const trustSignals = [
  "High confidence: well-supported, lower-chaos scenario families where the simulator behaves closest to a calibrated probability map.",
  "Moderate confidence: historically anchored enough to trust the broad race shape, but still materially sensitive to race-state evolution.",
  "Experimental / Low confidence: thinner circuit support, heavier chaos, wet crossover pressure, or scenario complexity beyond the strongest calibration set.",
];

export default function MethodologyPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="max-w-4xl">
        <Badge>Model and race simulation method</Badge>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4.2rem)] leading-[0.96] tracking-[-0.04em] text-white">
          How the 2026 Formula 1 model handles pace, strategy, tire wear, deployment, and race control.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          The current build aims for a believable 2026 Formula 1 weekend model without pretending to be a lap-perfect physics simulator.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>How provenance is separated</CardTitle>
            <CardDescription>
              The simulator distinguishes source-backed evidence, normalized project data, calibrated layers, and live scenario assumptions instead of blending them together.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {provenanceLayers.map((item) => (
              <div key={item.title} className="rounded-[16px] border border-white/8 bg-black/20 p-4">
                <Badge variant={item.tone as "default" | "success" | "warning" | "info"}>{item.title}</Badge>
                <div className="mt-3 text-sm leading-7 text-muted-foreground">{item.text}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to read confidence</CardTitle>
            <CardDescription>
              Confidence is a calibrated product signal, not an official probability of truth. It reflects support depth, volatility, and similarity to the current historical basket.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {trustSignals.map((item) => (
              <div key={item} className="rounded-[16px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>What the current build handles well</CardTitle>
            <CardDescription>
              The model is strongest when it is used as a scenario tool for race weekend tradeoffs rather than as a claim of exact lap-by-lap truth.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Circuit-specific behavior for overtaking, qualifying weight, tire stress, safety-car risk, and deployment sensitivity",
              "Strategy recommendations tied to weather, track position, degradation, and race-control assumptions",
              "Compare Mode for structured A/B scenario decisions instead of only single-board reads",
              "Driver explanations built from actual model signals instead of generic summary text",
              "Points-aware weekend outputs, including expected race points and constructors contribution",
              "Scenario trust summaries that separate historically grounded baselines from more experimental weather- or chaos-heavy reads",
            ].map((item) => (
              <div key={item} className="rounded-[16px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What is still simplified</CardTitle>
            <CardDescription>
              This is a structured Grand Prix simulator, not a full race-engineering stack.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Race resolution is event-aware and stint-aware rather than full lap-by-lap",
              "2026 deployment and active-aero behavior are modeled as scenario levers, not detailed control laws",
              "Qualifying is represented through leverage and pace rather than a separate session simulator",
              "Team and driver priors are estimated inputs, even though the 2026 season entities are real",
              "Historical support is still a small initial basket rather than a broad multi-season calibration set",
            ].map((item) => (
              <div key={item} className="rounded-[16px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-muted-foreground">
                {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Next realism steps</CardTitle>
          <CardDescription>
            The current architecture is already shaped for deeper Formula 1 realism without a rewrite.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            "Qualifying simulation and Q3 probability outputs",
            "Broader historical coverage across more circuits and weather families",
            "More detailed Sprint-weekend handling",
            "Richer FIA race-control and lap-window weather ingestion",
          ].map((item) => (
            <div key={item} className="rounded-[16px] border border-white/8 bg-black/20 p-4 text-sm leading-7 text-muted-foreground">
              {item}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
