import type { ReactNode } from "react";
import Link from "next/link";
import type { Route } from "next";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/simulator", label: "Simulator" },
  { href: "/methodology", label: "Methodology" },
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

export function SiteShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative min-h-screen overflow-hidden bg-background text-foreground", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(209,170,93,0.16),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(86,140,173,0.14),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-fade bg-[size:70px_70px] opacity-[0.08]" />
      <div className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col px-4 pb-8 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-4 z-40 mb-8 rounded-full border border-white/10 bg-slate-950/72 px-4 py-3 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/20 bg-primary/10 font-display text-sm tracking-[0.28em] text-primary">
                OO
              </div>
              <div>
                <div className="font-display text-sm tracking-[0.24em] text-white">ORYA ONE</div>
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">RaceSim</div>
              </div>
            </Link>
            <nav className="flex items-center gap-2 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full px-4 py-2 text-muted-foreground transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Badge variant="muted">Showcase release</Badge>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
