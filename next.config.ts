import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo can sit next to other lockfiles during development; pin the
  // workspace root so Turbopack never infers a parent directory.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
