import { SimulatorWorkspace } from "@/components/simulator-workspace";
import { Badge } from "@/components/ui/badge";

export default function SimulatorPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="max-w-3xl">
        <Badge>2026 Formula 1 strategy workspace</Badge>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.98] tracking-[-0.04em] text-white">
          Build a 2026 Grand Prix weekend, shape the race, and project the finish.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Set circuit assumptions, qualifying influence, tire degradation, safety-car risk, energy deployment pressure, and stint strategy from a single pit-wall workspace.
        </p>
      </div>
      <SimulatorWorkspace />
    </div>
  );
}
