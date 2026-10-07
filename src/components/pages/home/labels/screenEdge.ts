/**
 * Keeping the scene's DOM labels on screen (P27-31): the Earth's pin labels, the
 * probe's label and Parker's journey labels follow points of the 3D scene, and on a
 * narrow phone those points can sit near the edge — a label centred on one would be
 * cut off. These helpers are only used on phones (PHONE_QUERY): desktop keeps its
 * exact placement.
 */

/** Phones: narrower than Tailwind's `sm` (40rem). */
export const PHONE_QUERY = "(width < 40rem)";
/** Touch screens: no hover (Tailwind's `hover:` doesn't apply there). */
export const TOUCH_QUERY = "(hover: none)";
/** The room a label keeps from the screen's edge (px). */
export const LABEL_EDGE = 10;

/**
 * A label's left edge (px), moved inside the screen (`vw` wide, `margin` from its
 * edges) — but never off its anchor (`anchorX`, the point it names): a point that
 * leaves the screen takes its label with it, rather than leaving it stuck at the edge.
 */
export function keepOnScreen(
  left: number,
  w: number,
  anchorX: number,
  vw: number,
  margin = LABEL_EDGE,
): number {
  const inside = Math.min(Math.max(left, margin), vw - w - margin);
  return Math.min(Math.max(inside, anchorX - w), anchorX);
}
