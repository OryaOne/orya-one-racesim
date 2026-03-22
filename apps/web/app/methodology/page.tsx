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
            <CardTitle>What the current build handles well</CardTitle>
            <CardDescription>
              The model is strongest when it is used as a scenario tool for race weekend tradeoffs rather than as a claim of exact lap-by-lap truth.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              "Circuit-specific behavior for overtaking, qualifying weight, tire stress, safety-car risk, and deployment sensitivity",
              "Strategy recommendations tied to weather, track position, degradation, and race-control assumptions",
              "Driver explanations built from actual model signals instead of generic summary text",
              "Points-aware weekend outputs, including expected race points and constructors contribution",
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
            "More detailed Sprint-weekend handling",
            "Richer wet crossover and lap-window weather logic",
            "Calibration against real historical Formula 1 data",
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
