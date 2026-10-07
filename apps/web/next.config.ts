import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  // @task/core ships TypeScript source (no build step), so Next has to compile it.
  transpilePackages: ["@task/core"],

  // The app now lives two levels below the monorepo root. Without this, tracing
  // treats apps/web as the root and the standalone bundle drops packages/core.
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
};

export default nextConfig;
