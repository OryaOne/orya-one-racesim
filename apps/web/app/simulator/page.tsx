import { SimulatorWorkspace } from "@/components/simulator-workspace";
import { Badge } from "@/components/ui/badge";

export default function SimulatorPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="max-w-3xl">
        <Badge>Scenario workspace</Badge>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.98] tracking-[-0.04em] text-white">
          Build race assumptions, stress-test strategy, and inspect probabilistic outcomes.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          The simulator combines a pace model, deterministic race adjustments, and event-driven Monte Carlo simulation so strategy choices can be explored in a structured way.
        </p>
      </div>
      <SimulatorWorkspace />
    </div>
  );
}

