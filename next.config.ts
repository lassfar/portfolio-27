import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // The gallery's photos (P27-106): AVIF where the browser takes it (about a fifth smaller
    // than WebP), else WebP. On Netlify its image CDN makes and caches each size.
    formats: ["image/avif", "image/webp"],
    // Next's widths without 3840: the masters are about 2000 px, so a 3840 one would only
    // re-send the master's own size.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    // Only the photos go through the optimizer (anything else: 400).
    localPatterns: [{ pathname: "/photos/**", search: "" }],
  },
  experimental: {
    // Don't read dependencies' own source maps: r3f-perf's (the `?perf=overlay`
    // probe) points at its binary font file, which crashes Turbopack's dev
    // compiler ("invalid utf-8 sequence") for the whole page. Our code keeps its maps.
    turbopackInputSourceMaps: false,
    // Build from scratch every time: Netlify keeps `.next/cache` between deploys, and
    // Turbopack's build cache there once shipped a stale globals.css (new markup, old
    // styles — unstyled buttons). A clean build here takes ~10 s.
    turbopackFileSystemCacheForBuild: false,
  },
};

export default nextConfig;
