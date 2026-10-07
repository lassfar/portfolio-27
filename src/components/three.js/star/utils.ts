/**
 * Small, pure math helpers shared by the star scene. Kept tiny and dependency-
 * free so the animation code reads like prose instead of nested Math.min/max.
 */

/** Clamp a number into the 0..1 range. */
export const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

/**
 * Remap `value` from the input range [inMin, inMax] onto 0..1 (clamped).
 *
 * @example remap01(scrollProgress, 0.3, 1) // "0 until 0.3, then ramps to 1"
 */
export const remap01 = (value: number, inMin: number, inMax: number): number =>
  clamp01((value - inMin) / (inMax - inMin));

/**
 * The frame rate the damping factors were tuned at (P27-78): the feel judged on the dev
 * server (~85 FPS on a 120 Hz screen). Mutable: the dev panel ("〰 Story motion") tunes it.
 */
export const DAMPING = { referenceFps: 85 };

/**
 * Ease `current` toward `target`: `factor` (0..1) is the share of the gap closed per
 * frame at DAMPING.referenceFps. Higher = snappier; lower = more glide/lag.
 *
 * Time-based (P27-78): it closes the same share per second at any frame rate (`delta`,
 * the frame's seconds), so motion feels the same on a 30, 60 or 120 Hz screen. (It used
 * to step per frame: half as fast at 30 FPS, twice at 120.)
 */
export const damp = (current: number, target: number, factor: number, delta: number): number =>
  current + (target - current) * (1 - Math.pow(1 - factor, delta * DAMPING.referenceFps));

/** Linear interpolation between `a` and `b` by `t` (0..1). */
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Ease-out cubic — fast start, decelerating to a stop at t = 1. */
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

/**
 * Ease-in-out cubic — velocity is 0 at BOTH ends, so a scroll-driven move eases
 * gently out of its start pose and glides to REST at its destination (no abrupt
 * arrival, and no velocity jump when it then holds). Used for the Earth dive so
 * the planet settles smoothly into its dwell.
 */
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
