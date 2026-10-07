import { STORY_CHAPTERS } from "#/components/pages/home/timeline/config";
import { chapterAt } from "#/components/pages/home/timeline/layout";
import { useQuality } from "#/stores/useQuality";
import { PERFORMANCE } from "./performance";

/**
 * The `?perf` measurements, per chapter of the story (P27-78): every frame's time, draw
 * calls and points, and the main thread's long tasks, filed under the chapter on screen.
 * PerfProbe (inside the canvas) records; the HUD reads, and builds a report to paste
 * into the task. Invisible to visitors: nothing records without the flag.
 */

export type PerfMode = "off" | "probe" | "overlay";

/** `?perf` → the probe + its HUD; `?perf=overlay` → r3f-perf's overlay instead. */
export function perfMode(): PerfMode {
  if (typeof window === "undefined") return "off";
  const flag = new URLSearchParams(window.location.search).get("perf");
  if (flag === null || flag === "0") return "off";
  return flag === "overlay" ? "overlay" : "probe";
}

/** What the GPU and the canvas are, for the report's header. */
export type GpuInfo = {
  renderer: string; // e.g. "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics … Direct3D11 …)"
  pixelRatio: number; // the canvas's (capped) pixel ratio
  width: number; // drawing buffer, px
  height: number;
};

/** One chapter's totals. */
export type ChapterRow = {
  name: string;
  seconds: number;
  fps: number;
  p50: number; // frame ms
  p95: number;
  worst: number;
  slow: number; // frames over SLOW_MS (under 30 fps)
  longTasks: number;
  longTaskMs: number;
  calls: number; // average per frame
  points: number;
};

const SLOW_MS = 34;
const MAX_FRAMES = 20000; // per chapter (~5 min at 60 fps)

type ChapterRecord = {
  frameMs: number[];
  calls: number;
  points: number;
  longTasks: number;
  longTaskMs: number;
};

const empty = (): ChapterRecord => ({
  frameMs: [],
  calls: 0,
  points: 0,
  longTasks: 0,
  longTaskMs: 0,
});

let records: ChapterRecord[] = STORY_CHAPTERS.map(empty);
let recordsFrom = 0; // ms (performance.now) when the records started
let current = 0;

/** The quality tiers' log: where they started (and why), then every step since. */
type QualityChange = { at: number; chapter: string; from: number; to: number; fps: number };
let qualityStart: { step: number; gpu: string } | null = null;
let qualityChanges: QualityChange[] = [];
let readGpu: (() => GpuInfo) | null = null;

/** File one frame under the chapter at master progress `mp`. */
export function recordFrame(frameMs: number, calls: number, points: number, mp: number): void {
  current = chapterAt(STORY_CHAPTERS, mp);
  // Skip the first frame and the gaps of a hidden tab (rAF pauses).
  if (frameMs <= 0 || frameMs > 1000) return;
  const r = records[current];
  if (r.frameMs.length >= MAX_FRAMES) return;
  r.frameMs.push(frameMs);
  r.calls += calls;
  r.points += points;
}

/** A main-thread task over 50 ms (a shader compile, a particle build…), in the current chapter. */
export function recordLongTask(ms: number): void {
  const r = records[current];
  r.longTasks++;
  r.longTaskMs += ms;
}

export function resetRecords(): void {
  records = STORY_CHAPTERS.map(empty);
  qualityChanges = [];
  recordsFrom = performance.now();
}

export function recordQualityStart(step: number, gpu: string): void {
  qualityStart = { step, gpu };
}

export function recordQualityChange(from: number, to: number, fps: number): void {
  qualityChanges.push({
    at: performance.now(),
    chapter: STORY_CHAPTERS[current].name,
    from,
    to,
    fps,
  });
}

export function setGpuReader(read: (() => GpuInfo) | null): void {
  readGpu = read;
}

export function gpuInfo(): GpuInfo | null {
  return readGpu?.() ?? null;
}

export function currentChapterName(): string {
  return STORY_CHAPTERS[current].name;
}

function row(name: string, r: ChapterRecord): ChapterRow {
  const sorted = [...r.frameMs].sort((a, b) => a - b);
  const n = sorted.length;
  const at = (q: number) => (n ? sorted[Math.min(n - 1, Math.floor(q * (n - 1)))] : 0);
  const total = sorted.reduce((a, x) => a + x, 0);
  return {
    name,
    seconds: total / 1000,
    fps: total ? (n * 1000) / total : 0,
    p50: at(0.5),
    p95: at(0.95),
    worst: n ? sorted[n - 1] : 0,
    slow: sorted.filter((x) => x > SLOW_MS).length,
    longTasks: r.longTasks,
    longTaskMs: r.longTaskMs,
    calls: n ? r.calls / n : 0,
    points: n ? r.points / n : 0,
  };
}

/** Every chapter with frames, then "All". */
export function chapterRows(): ChapterRow[] {
  const rows = STORY_CHAPTERS.map((c, i) => row(c.name, records[i])).filter((r) => r.seconds > 0);
  const all = records.reduce(
    (a, r) => ({
      frameMs: a.frameMs.concat(r.frameMs),
      calls: a.calls + r.calls,
      points: a.points + r.points,
      longTasks: a.longTasks + r.longTasks,
      longTaskMs: a.longTaskMs + r.longTaskMs,
    }),
    empty(),
  );
  return all.frameMs.length ? [...rows, row("All", all)] : rows;
}

const fixed = (x: number, digits = 1) => x.toFixed(digits);

/** The report, as Markdown: the machine, then one row per chapter. */
export function buildReport(label: string): string {
  const gpu = gpuInfo();
  const nav = navigator as Navigator & { deviceMemory?: number };
  const lines = [
    `## P27 perf report: ${label} (${new Date().toLocaleString()})`,
    `- GPU: ${gpu?.renderer ?? "unknown"}`,
    `- Canvas: ${gpu ? `${gpu.width}×${gpu.height} px at pixel ratio ${gpu.pixelRatio}` : "unknown"}; screen ${screen.width}×${screen.height} at devicePixelRatio ${window.devicePixelRatio}`,
    `- CPU threads: ${nav.hardwareConcurrency ?? "?"}; memory: ${nav.deviceMemory ?? "?"} GB`,
    `- Browser: ${navigator.userAgent}`,
    `- Settings: ${Object.entries(PERFORMANCE)
      .map(([key, value]) => `${key} ${value}`)
      .join(", ")}`,
    `- Quality: started at step ${qualityStart?.step ?? "?"} (${qualityStart?.gpu ?? "?"} GPU); now step ${useQuality.getState().step}`,
    `- Quality changes: ${
      qualityChanges.length
        ? qualityChanges
            .map(
              (c) =>
                `${fixed((c.at - recordsFrom) / 1000)} s, ${c.chapter}: ${c.from} → ${c.to} (${fixed(c.fps)} FPS)`,
            )
            .join("; ")
        : "none"
    }`,
    "",
    `| Chapter | Seconds | Avg FPS | p50 ms | p95 ms | Worst ms | Frames > ${SLOW_MS} ms | Long tasks (ms) | Draw calls | Points |`,
    "|---|---|---|---|---|---|---|---|---|---|",
    ...chapterRows().map(
      (r) =>
        `| ${r.name} | ${fixed(r.seconds)} | ${fixed(r.fps)} | ${fixed(r.p50)} | ${fixed(r.p95)} | ${fixed(r.worst)} | ${r.slow} | ${r.longTasks} (${Math.round(r.longTaskMs)}) | ${Math.round(r.calls)} | ${Math.round(r.points)} |`,
    ),
  ];
  return lines.join("\n");
}
