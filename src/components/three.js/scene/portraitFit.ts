/**
 * Fitting the story's subjects on portrait screens (P27-31).
 *
 * The camera has a fixed VERTICAL field of view, so its framing was set for height: on
 * a phone held upright, a subject sized for a landscape screen (Saturn and its rings,
 * the Earth, the galaxy) spills off both sides. `portraitFit` gives how much farther
 * the camera should stand from a subject so its whole width fits — moving the camera
 * rather than shrinking the subject, since the particle shaders size their dots by
 * distance (the dots keep their look).
 *
 * It is exactly 1 on any landscape or square screen (aspect ≥ 1), so desktop framing is
 * unchanged to the last digit; between square and `fullAt` it eases in, so turning a
 * screen never makes the camera jump.
 */
export const PORTRAIT_FIT = {
  fullAt: 0.75, // aspect (width / height) from which a subject is fully fitted
};

/**
 * A subject's width as a share of the screen's HEIGHT at its framing: its half-width
 * over its distance (`halfWidthOverDistance`, i.e. the tangent of its half-angle), for
 * a vertical field of view of `fovDeg`, with a `margin` (1.1 = 10% room around it).
 */
export function spanOf(halfWidthOverDistance: number, fovDeg: number, margin = 1): number {
  return (halfWidthOverDistance / Math.tan((fovDeg * Math.PI) / 360)) * margin;
}

/**
 * How much farther the camera stands (a multiplier ≥ 1) so a subject spanning `span`
 * of the screen's height fits the width of a screen of `aspect`.
 */
export function portraitFit(aspect: number, span: number, fullAt = PORTRAIT_FIT.fullAt): number {
  if (!(aspect < 1)) return 1; // landscape, square (and NaN): exactly as designed
  const need = span / aspect; // its width, in screen widths, as framed today
  if (need <= 1) return 1;
  const t = Math.min(1, Math.max(0, (1 - aspect) / (1 - fullAt)));
  return 1 + (need - 1) * t * t * (3 - 2 * t);
}

/** A fit eased in by `t` (0..1): 1 at t = 0, `k` at t = 1 — exactly 1 whenever k is. */
export function fitRamp(k: number, t: number): number {
  return k === 1 ? 1 : 1 + (k - 1) * t;
}
