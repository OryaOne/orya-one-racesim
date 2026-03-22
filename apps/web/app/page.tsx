import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CloudSunRain,
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
    title: "Neural pace prior",
    text: "A compact PyTorch model estimates baseline pace from structured driver, track, and condition features.",
    icon: BrainCircuit,
  },
  {
    title: "Deterministic race logic",
    text: "Fuel load, tire wear, qualifying influence, pit delta, and strategy-template tradeoffs remain explicit and inspectable.",
    icon: Sigma,
  },
  {
    title: "Event-driven Monte Carlo",
    text: "Weather transitions, cautions, DNFs, and late-race incidents are sampled repeatedly to produce outcome distributions rather than single-point claims.",
    icon: CloudSunRain,
  },
];

const releaseSignals = [
  "Dark-first technical UI with a serious motorsport analytics posture",
  "Original branding and synthetic sample data designed for public release",
  "FastAPI + Next.js monorepo with clear extension points",
  "Methodology, roadmap, contribution docs, and tests included from the start",
];

export default function HomePage() {
  return (
    <div className="space-y-8 pb-10">
      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="overflow-hidden border-primary/10 bg-transparent">
          <CardContent className="p-8 sm:p-10 lg:p-12">
            <Badge>Open-source showcase MVP</Badge>
            <h1 className="mt-6 max-w-5xl font-display text-[clamp(3rem,7vw,6.4rem)] leading-[0.92] tracking-[-0.05em] text-white">
              Premium Grand Prix simulation for pace, strategy, and race-environment scenario analysis.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Orya One RaceSim is a serious motorsport-inspired research product. It is built to feel like analytics software, not a gambling page, not a toy simulator, and not a marketing shell.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/simulator">
                  Launch simulator
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href="/methodology">Review methodology</Link>
              </Button>
            </div>
            <div className="mt-10 grid gap-3 sm:grid-cols-2">
              {releaseSignals.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.03))]">
          <CardHeader>
            <Badge variant="warning">Product surface</Badge>
            <CardTitle className="mt-4 text-2xl">A credible simulation control center</CardTitle>
            <CardDescription>
              The simulator is organized as a premium control room with scenario framing, event tuning, strategy posture, driver intervention, and explainable output dashboards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-[28px] border border-primary/12 bg-slate-950/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Example scenario</div>
                  <div className="mt-1 font-display text-2xl text-white">Rainford Harbor Grand Prix</div>
                </div>
                <div className="rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-primary">
                  1200 runs
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Strategy posture</div>
                  <div className="mt-2 text-lg text-white">Flexible mixed field</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Adaptive and caution-aware plans rise in value as event pressure increases.
                  </div>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Output emphasis</div>
                  <div className="mt-2 text-lg text-white">Probability and confidence</div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    The product focuses on distributions, scenario narratives, and interpretable risks.
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  { label: "Neural prior", value: "Pace baseline" },
                  { label: "Rule engine", value: "Tire / fuel / pit" },
                  { label: "Monte Carlo", value: "Event pressure" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[22px] border border-white/8 bg-black/20 p-4">
                    <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{item.label}</div>
                    <div className="mt-2 text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
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
              <CardTitle>Designed as product software</CardTitle>
            </div>
            <CardDescription>
              Dense when needed, quiet when not. The UI aims for the tone of elite analytics tooling rather than entertainment software.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-muted-foreground">
            <p>
              Scenario building, strategy comparison, and results interpretation sit in one workspace. Users can adjust conditions, inspect recommendations, and read event-driven outcome summaries without leaving the main flow.
            </p>
            <p>
              The product is usable immediately with synthetic data, while the code structure keeps space for future calibration, real data ingestion, and richer race-resolution logic.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <CardTitle>Public release quality</CardTitle>
            </div>
            <CardDescription>
              Built to be publishable under both a personal GitHub account and the Orya One organization.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {[
              "Hybrid modeling with explicit assumptions",
              "FastAPI backend and typed Next.js frontend",
              "Structured docs for architecture, methodology, and roadmap",
              "Sample datasets with field schema documentation",
            ].map((item) => (
              <div key={item} className="rounded-[24px] border border-white/8 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
                {item}
              </div>
            ))}
            <div className="rounded-[24px] border border-primary/15 bg-primary/8 p-5 sm:col-span-2">
              <div className="flex items-center gap-3">
                <GitBranch className="h-4 w-4 text-primary" />
                <div className="text-[11px] uppercase tracking-[0.18em] text-primary">Repository posture</div>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Clear setup, serious framing, realistic limitations, and modular code boundaries are treated as product features, not cleanup tasks left for later.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
