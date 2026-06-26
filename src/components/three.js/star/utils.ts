/**
 * Small, pure math helpers shared by the star scene. Kept tiny and dependency-
 * free so the animation code reads like prose instead of nested Math.min/max.
 */

/** Clamp a number into the 0..1 range. */
export const clamp01 = (value: number): number =>
  Math.max(0, Math.min(1, value));

/**
 * Remap `value` from the input range [inMin, inMax] onto 0..1 (clamped).
 *
 * @example remap01(scrollProgress, 0.3, 1) // "0 until 0.3, then ramps to 1"
 */
export const remap01 = (
  value: number,
  inMin: number,
  inMax: number
): number => clamp01((value - inMin) / (inMax - inMin));

/**
 * Ease `current` toward `target` by `factor` (0..1) — a simple per-frame
 * damping. Higher factor = snappier; lower = more glide/lag.
 */
export const damp = (
  current: number,
  target: number,
  factor: number
): number => current + (target - current) * factor;
