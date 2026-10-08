/** The bottom sheet's swipe (P27-95): how far, how fast. */
export const SHEET = {
  /** It follows the finger once it has moved this far (px): a tap stays a tap. */
  startAfter: 6,
  /** It closes past this far down (px)… */
  closeDistance: 80,
  /** …or this share of its height, whichever is more. */
  closeShare: 0.25,
  /** Or on a flick: this fast (px/ms, over the last moments)… */
  flickSpeed: 0.5,
  /** …and this far at least (px). */
  flickDistance: 24,
  /** How far back the flick's speed is measured (ms). */
  flickWindow: 80,
} as const;

/**
 * Where a swipe down on the bottom sheet ends: it closes past max(80 px, a quarter of its
 * height), or on a flick downward; else it goes back in place.
 */
export function sheetRelease(dy: number, velocity: number, height: number): "close" | "back" {
  if (dy >= Math.max(SHEET.closeDistance, SHEET.closeShare * height)) return "close";
  if (velocity >= SHEET.flickSpeed && dy >= SHEET.flickDistance) return "close";
  return "back";
}
