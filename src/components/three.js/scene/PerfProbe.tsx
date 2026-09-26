"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useMemo, useRef } from "react";
import { journeyAtGalaxy } from "#/components/three.js/galaxy/pace";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { jumpToJourney, jumpToVoyage } from "./devPanel";

/**
 * Dev-only performance probe, for measuring what each beat of the journey costs.
 * Invisible to visitors — it only mounts with a query flag (like `?gui`):
 *   • `?perf` — records every frame's renderer totals (draw calls, points, triangles,
 *     lines, compiled programs) and timings into a ring buffer, and exposes
 *     `window.__p27perf` (stats, long frames, jump-to-beat helpers) for test scripts;
 *   • `?perf=overlay` — shows r3f-perf's live overlay (FPS, GPU time, calls) instead.
 * (Never both: each resets the renderer's counters.)
 */

const Perf = lazy(() => import("r3f-perf").then((m) => ({ default: m.Perf })));

type Mode = "off" | "probe" | "overlay";

function perfMode(): Mode {
  if (typeof window === "undefined") return "off";
  const flag = new URLSearchParams(window.location.search).get("perf");
  if (flag === null || flag === "0") return "off";
  return flag === "overlay" ? "overlay" : "probe";
}

const PerfProbe = () => {
  const mode = useMemo(perfMode, []);
  if (mode === "off") return null;
  if (mode === "overlay")
    return (
      <Suspense fallback={null}>
        <Perf position="bottom-left" />
      </Suspense>
    );
  return <Probe />;
};

export default PerfProbe;

/** One frame's measurements. */
type Sample = {
  frameMs: number; // time since the previous frame (1000 / FPS)
  cpuMs: number; // JS + render submission within this frame
  calls: number;
  points: number;
  triangles: number;
  lines: number;
  programs: number;
  progress: number; // the journey's master progress (0..1)
};

const SIZE = 600; // ~10 s at 60 fps

declare global {
  interface Window {
    __p27perf?: {
      /** Averages (and maxima) over the last `frames` frames. */
      stats: (frames?: number) => Record<string, number>;
      /** Frames slower than `ms` among the last `frames`. */
      longFrames: (ms?: number, frames?: number) => number;
      /** The last frame's sample. */
      last: () => Sample | undefined;
      jump: (mp: number) => void;
      jumpVoyage: (v: number) => void;
      jumpGalaxy: (g: number) => void;
    };
  }
}

const Probe = () => {
  const gl = useThree((s) => s.gl);
  const ring = useRef<Sample[]>([]);
  const head = useRef(0);
  const frameStart = useRef(0);
  const lastEnd = useRef(0);

  useEffect(() => {
    const autoReset = gl.info.autoReset;
    // One reset per frame (below), so the totals cover every render in it — the
    // galaxy layer, the scene, and each post-processing pass.
    gl.info.autoReset = false;
    const recent = (frames: number) => {
      const out: Sample[] = [];
      const n = Math.min(frames, ring.current.length);
      for (let i = 1; i <= n; i++) out.push(ring.current[(head.current - i + SIZE) % SIZE]);
      return out;
    };
    window.__p27perf = {
      stats: (frames = 120): Record<string, number> => {
        const s = recent(frames);
        if (!s.length) return {};
        const avg = (k: keyof Sample) => s.reduce((a, x) => a + x[k], 0) / s.length;
        const max = (k: keyof Sample) => Math.max(...s.map((x) => x[k]));
        return {
          frames: s.length,
          fps: 1000 / avg("frameMs"),
          frameMs: avg("frameMs"),
          frameMsMax: max("frameMs"),
          cpuMs: avg("cpuMs"),
          calls: avg("calls"),
          points: avg("points"),
          triangles: avg("triangles"),
          lines: avg("lines"),
          programs: max("programs"),
          progress: s[0].progress,
        };
      },
      longFrames: (ms = 34, frames = SIZE) => recent(frames).filter((x) => x.frameMs > ms).length,
      last: () => recent(1)[0],
      jump: jumpToJourney,
      jumpVoyage: jumpToVoyage,
      jumpGalaxy: (g: number) => jumpToJourney(journeyAtGalaxy(g)),
    };
    return () => {
      gl.info.autoReset = autoReset;
      delete window.__p27perf;
    };
  }, [gl]);

  // First thing each frame: reset the counters and start the clock.
  useFrame(() => {
    gl.info.reset();
    frameStart.current = performance.now();
  }, -1000);

  // Last thing each frame (after the composer, at 1): record the totals.
  useFrame(() => {
    const now = performance.now();
    const r = gl.info.render;
    ring.current[head.current] = {
      frameMs: lastEnd.current ? now - lastEnd.current : 0,
      cpuMs: now - frameStart.current,
      calls: r.calls,
      points: r.points,
      triangles: r.triangles,
      lines: r.lines,
      programs: gl.info.programs?.length ?? 0,
      progress: journeyTrigger.current?.progress ?? 0,
    };
    head.current = (head.current + 1) % SIZE;
    lastEnd.current = now;
  }, 1000);

  return null;
};
