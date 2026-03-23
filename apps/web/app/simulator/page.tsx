import { SimulatorWorkspace } from "@/components/simulator-workspace";
import { Badge } from "@/components/ui/badge";

export default function SimulatorPage() {
  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(17,20,26,0.88),rgba(10,12,16,0.96))] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>2026 Formula 1 strategy workspace</Badge>
          <Badge variant="muted">Pit-wall dashboard</Badge>
        </div>
        <div className="max-w-4xl">
          <h1 className="font-display text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[0.96] tracking-[-0.05em] text-white">
            Build the weekend, run the race, and read the board like a strategy wall.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Grand Prix setup, race-control assumptions, stint calls, and outcome projection are organized into one compact 2026 Formula 1 command center.
          </p>
        </div>
      </div>
      <SimulatorWorkspace />
    </div>
  );
}
