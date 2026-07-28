import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo can sit next to other lockfiles during development; pin the
  // workspace root so Turbopack never infers a parent directory.
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Opt out of Turbopack's beta on-disk dev cache. On 2026-07-27 that cache
    // grew to 1.09 GB of stale .sst files, after which `next dev` hung on the
    // first compile and respawned build workers without bound — 1,300+ node
    // processes, 38.5 GB of RAM, machine at its commit limit. This project is
    // ~90 files and boots in half a second cold, so the cache buys us almost
    // nothing and costs a whole failure mode. Revisit if the feature leaves beta.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
