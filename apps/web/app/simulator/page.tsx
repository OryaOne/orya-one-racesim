import { SimulatorWorkspace } from "@/components/simulator-workspace";
import { Badge } from "@/components/ui/badge";

export default function SimulatorPage() {
  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-col gap-4 rounded-[16px] border border-white/8 bg-[linear-gradient(180deg,rgba(14,17,22,0.96),rgba(8,10,13,1))] px-5 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.26)] sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>2026 Formula 1 strategy workspace</Badge>
          <Badge variant="muted">Pit wall / race engineering</Badge>
        </div>
        <div className="max-w-4xl">
          <h1 className="font-display text-[clamp(2.2rem,4.6vw,3.8rem)] leading-[0.96] tracking-[-0.05em] text-white">
            Build the weekend and read the board like a pit-wall strategy screen.
          </h1>
          <p className="mt-3 max-w-3xl font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground sm:text-[12px]">
            Grand Prix setup, race-control pressure, stint calls, and outcome projection in one compact command center.
          </p>
        </div>
      </div>
      <SimulatorWorkspace />
    </div>
  );
}
