import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    // Don't read dependencies' own source maps: r3f-perf's (the `?perf=overlay`
    // probe) points at its binary font file, which crashes Turbopack's dev
    // compiler ("invalid utf-8 sequence") for the whole page. Our code keeps its maps.
    turbopackInputSourceMaps: false,
  },
};

export default nextConfig;
