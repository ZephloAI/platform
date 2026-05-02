import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // zephlo is consumed via `npm link` from the monorepo widget/ package.
  // Tracing root must sit above the symlink target so Next can follow it.
  outputFileTracingRoot: path.join(__dirname, ".."),
  // Turbopack takes a relative path (from this config file) as the alias target.
  turbopack: {
    resolveAlias: {
      zephlo: "../widget/dist/zephlo.esm.js",
    },
  },
  // Rewrite lucide-react barrel imports to per-icon deep paths at build time.
  // v1.7.0 is a single 220 KB ESM file; without this, every icon import pulls
  // the whole library. Tree-shake-friendly path: lucide-react/dist/esm/icons/<kebab>.
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{kebabCase member}}",
      preventFullImport: true,
    },
  },
  allowedDevOrigins: ['192.168.100.108'],
};

export default nextConfig;
