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
