import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CloudSunRain,
  Flag,
  GitBranch,
  LayoutDashboard,
  ShieldCheck,
  Sigma,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    title: "Real 2026 Formula 1 season frame",
    text: "The app now uses the 2026 Formula 1 teams, drivers, Grand Prix calendar, and Sprint weekends as the base catalog.",
    icon: Flag,
  },
  {
    title: "Hybrid race model",
    text: "A compact PyTorch pace prior is combined with explicit race logic for qualifying weight, tire wear, pit loss, and 2026 deployment pressure.",
    icon: BrainCircuit,
  },
  {
    title: "Race control and Monte Carlo",
    text: "Weather swings, VSCs, safety cars, red flags, incidents, and DNFs are sampled repeatedly so the result stays probabilistic instead of fixed.",
    icon: CloudSunRain,
  },
  {
    title: "Trust and calibration layer",
    text: "Each scenario now carries confidence, historical support, grounding, and volatility signals so the product is explicit about what is calibrated and what is estimated.",
    icon: ShieldCheck,
  },
];

const releaseSignals = [
  "24-round 2026 Formula 1 calendar with Sprint weekend flagging where relevant",
  "22-driver, 11-team grid with real 2026 line-ups, estimated pace priors, and trust signaling",
  "Circuit-specific behavior for Monaco, Spa, Monza, Singapore, Baku, Las Vegas, and more",
  "Compare Mode for A/B strategy analysis, deltas, and race-evolution shifts",
  "Historical backtesting, provenance separation, and calibration-aware race reads",
];

export default function HomePage() {
  return (
    <div className="space-y-8 pb-10">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden border-primary/10 bg-transparent">
          <CardContent className="p-8 sm:p-10 lg:p-12">
            <Badge>2026 Formula 1 Grand Prix simulation</Badge>
            <h1 className="mt-6 max-w-5xl font-display text-[clamp(3rem,7vw,6.2rem)] leading-[0.92] tracking-[-0.05em] text-white">
              A 2026 Formula 1 strategy wall for pace, tire degradation, deployment, race control, and scenario comparison.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Orya One RaceSim is built around a Grand Prix decision workflow: choose a 2026 Formula 1 round, review circuit behavior, tune race-control assumptions, compare two scenarios when needed, and inspect calibrated probability-based outcomes from one strategy wall.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/simulator">
                  Open strategy wall
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/methodology">Read the model notes</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {releaseSignals.map((item) => (
                <div key={item} className="rounded-[16px] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))]">
          <CardHeader>
            <Badge variant="warning">Live product snapshots</Badge>
            <CardTitle className="mt-4 text-2xl">Built around a Grand Prix weekend</CardTitle>
            <CardDescription>
              The current UI now spans the branded hero, the strategy wall itself, and the simulation output board used to read race evolution and decision deltas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-[18px] border border-primary/18 bg-slate-950/80">
              <Image
                src="/brand/orya_hero_banner.svg"
                alt="Orya One RaceSim hero banner showing 2026 strategy simulator branding and key season metrics."
                width={680}
                height={386}
                className="h-auto w-full"
                priority
              />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-[18px] border border-white/8 bg-black/20">
                <Image
                  src="/brand/orya_strategy_wall.svg"
                  alt="Strategy wall preview showing race control, stint planning, timing strip, and driver strategy modules."
                  width={680}
                  height={390}
                  className="h-auto w-full"
                />
              </div>
              <div className="overflow-hidden rounded-[18px] border border-white/8 bg-black/20">
                <Image
                  src="/brand/orya_simulation_output.svg"
                  alt="Simulation output preview showing win probabilities, strategy ladders, and lap-by-lap race output."
                  width={680}
                  height={390}
                  className="h-auto w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        {pillars.map((pillar) => (
          <Card key={pillar.title}>
            <CardHeader>
              <pillar.icon className="h-5 w-5 text-primary" />
              <CardTitle className="mt-4">{pillar.title}</CardTitle>
              <CardDescription>{pillar.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <CardTitle>Made to feel like race operations software</CardTitle>
            </div>
            <CardDescription>
              The UI is meant to scan like a strategy wall, not a generic analytics dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Circuit profile, race-control tuning, Compare Mode, trust signaling, and driver-level outputs sit in one workspace. The intent is to make the tradeoffs readable while keeping the flow dense enough to feel useful.
            </p>
            <p>
              The app still uses modeled pace priors rather than live telemetry, but the season structure, historical support layer, and trust messaging now make it clearer where the simulator is grounded and where it is exploratory.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <GitBranch className="h-5 w-5 text-primary" />
              <CardTitle>Set up for deeper realism later</CardTitle>
            </div>
            <CardDescription>
              The current architecture keeps the UI, API, and simulator modular enough for future qualifying, calibration, and historical-data work.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              "Real 2026 entities in the catalog, with estimated circuit and team priors",
              "FastAPI backend with typed Next.js frontend contracts",
              "Historical backtesting, provenance separation, and calibration-aware trust summaries",
              "Simulation outputs for expected finish, points, podium, win, disruption risk, and compare deltas",
            ].map((item) => (
              <div key={item} className="rounded-[16px] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
                {item}
              </div>
            ))}
            <div className="rounded-[16px] border border-primary/15 bg-primary/8 p-5 sm:col-span-2">
              <div className="flex items-center gap-3">
                <Sigma className="h-4 w-4 text-primary" />
                <div className="text-[11px] uppercase tracking-[0.18em] text-primary">Model posture</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Pace is learned, race mechanics stay explicit, and uncertainty is sampled. That boundary is deliberate and shows up throughout the product.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
