import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: path.resolve(import.meta.dirname, "../.."),
};

export default nextConfig;
