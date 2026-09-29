import type { WebGLRenderer } from "three";

/**
 * The scene's quality (P27-78): how sharp it's drawn and what it can skip, so weak GPUs
 * hold 60 FPS. Full quality is today's look.
 */

/** The canvas's highest pixel ratio (full quality); lower quality lowers it, never below 1. */
export const MAX_DPR = 1.5;

/** The canvas pixel ratio at full quality on this screen (R3F's `dpr={[1, MAX_DPR]}`). */
export function fullQualityDpr(): number {
  return Math.min(Math.max(window.devicePixelRatio || 1, 1), MAX_DPR);
}

/**
 * The pixel ratio a dot shader sizes its dots with, so every dot keeps its size ON
 * SCREEN whatever the canvas resolution. These shaders were tuned with
 * `min(devicePixelRatio, 2)` at the full-quality canvas; scaling that by how far the
 * canvas is below full quality keeps today's look exactly at full quality.
 */
export function pointPixelRatio(canvasDpr: number): number {
  return (Math.min(window.devicePixelRatio || 1, 2) * canvasDpr) / fullQualityDpr();
}

export type GlowQuality = "full" | "light";

/** One step of the quality ladder. */
export type QualityStep = {
  name: string;
  /** The canvas's highest pixel ratio (R3F `dpr={[1, maxDpr]}`). */
  maxDpr: number;
  /** Multisampling as set by `PERFORMANCE.msaa`, or off. */
  msaa: boolean;
  /** The galaxy's soft glow: every sprite, or half of them, brighter (see Galaxy). */
  glow: GlowQuality;
};

/**
 * The quality ladder, least visible reduction first; step 0 is full quality. The tiers
 * (QualityMonitor) move one step at a time. The floor keeps one canvas pixel per
 * screen point.
 */
export const QUALITY_STEPS: readonly QualityStep[] = [
  { name: "high", maxDpr: MAX_DPR, msaa: true, glow: "full" },
  { name: "no multisampling", maxDpr: MAX_DPR, msaa: false, glow: "full" },
  { name: "1.25×", maxDpr: 1.25, msaa: false, glow: "full" },
  { name: "1.25×, light glow", maxDpr: 1.25, msaa: false, glow: "light" },
  { name: "low (1×, light glow)", maxDpr: 1, msaa: false, glow: "light" },
];

export const LOWEST_STEP = QUALITY_STEPS.length - 1;

/** The GPU's real name, e.g. "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics … Direct3D11 …)". */
export function gpuRenderer(gl: WebGLRenderer): string {
  const ctx = gl.getContext();
  const debug = ctx.getExtension("WEBGL_debug_renderer_info");
  return String(ctx.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : ctx.RENDERER));
}

export type GpuClass = "software" | "integrated" | "dedicated";

const SOFTWARE = /swiftshader|llvmpipe|softpipe|software|basic render/i;
const INTEGRATED =
  /intel|iris|uhd|hd graphics|mali|adreno|powervr|radeon\(tm\) graphics|radeon graphics|vega \d+ graphics/i;

/** A rough class from the GPU's name: integrated GPUs share the CPU's memory bandwidth. */
export function gpuClass(renderer: string): GpuClass {
  if (SOFTWARE.test(renderer)) return "software";
  if (INTEGRATED.test(renderer)) return "integrated";
  return "dedicated";
}

/**
 * Where to start before anything is measured: integrated GPUs one step lower (so the
 * first seconds are already smooth), software rendering at the lowest step.
 */
export function startStep(renderer: string): number {
  const gpu = gpuClass(renderer);
  if (gpu === "software") return LOWEST_STEP;
  return gpu === "integrated" ? 1 : 0;
}
