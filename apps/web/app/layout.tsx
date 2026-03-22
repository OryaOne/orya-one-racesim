import type { ReactNode } from "react";
import type { Metadata } from "next";

import { SiteShell } from "@/components/site-shell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Orya One RaceSim",
  description: "Premium motorsport scenario simulation built on a hybrid pace, strategy, and event engine.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
