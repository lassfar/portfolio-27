import { LAB_SUN } from "#/components/pages/home/book/dots/shapes/sun";
import { DEG } from "#/components/pages/home/book/dots/patterns";

/*
 * The Lab's drawing in the calm book (P27-93): the Parker Solar Probe on its loops around the
 * Sun, each one closer. In the drawing's 500 × 400 frame, the Sun where its dots are
 * (LAB_SUN). Drawn to tell the story, not to scale: the loops' far end is off the frame.
 */

/** How far each loop reaches from the Sun at its far end (the frame's units). */
const FAR = 330;
/** Each loop's closest pass to the Sun's centre, newest last: every loop a little closer. */
export const PERIHELIA = [144, 120, 96, 76] as const;
/** The probe's scale: the frame's units per metre (it's drawn in metres, PROBE). */
export const PROBE_SCALE = 24;
/** Where the probe sits on the newest loop (its ellipse's angle). */
const PROBE_AT = -1;

/** A loop's turn about the Sun (radians): the loops fan out a little. */
const turnOf = (j: number) => (-9 + j * 3) * DEG;

export type Loop = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** Its turn about the Sun (degrees). */
  turn: number;
  newest: boolean;
};

/** An ellipse with the Sun at a focus, from its closest pass `q`. */
const ellipse = (q: number) => {
  const a = (q + FAR) / 2;
  return { a, c: a - q, b: Math.sqrt(q * FAR) };
};

/** Each loop of Parker's orbit, oldest first. */
export const loops = (): Loop[] =>
  PERIHELIA.map((q, j) => {
    const { a, c, b } = ellipse(q);
    return {
      cx: LAB_SUN.x + c,
      cy: LAB_SUN.y,
      rx: a,
      ry: b,
      turn: turnOf(j) / DEG,
      newest: j === PERIHELIA.length - 1,
    };
  });

/** The newest loop's closest point to the Sun: where its label points. */
export const closest = () => {
  const j = PERIHELIA.length - 1;
  const q = PERIHELIA[j];
  const r = turnOf(j);
  return { x: LAB_SUN.x - q * Math.cos(r), y: LAB_SUN.y - q * Math.sin(r) };
};

/** The probe on the newest loop: where it is, and its turn (degrees) so its heat shield faces the Sun. */
export const probe = () => {
  const j = PERIHELIA.length - 1;
  const { a, c, b } = ellipse(PERIHELIA[j]);
  const r = turnOf(j);
  const lx = c + a * Math.cos(PROBE_AT);
  const ly = b * Math.sin(PROBE_AT);
  const x = LAB_SUN.x + lx * Math.cos(r) - ly * Math.sin(r);
  const y = LAB_SUN.y + lx * Math.sin(r) + ly * Math.cos(r);
  // The shield is the probe's -y side (its local "up"): turned to point at the Sun.
  const turn = Math.atan2(LAB_SUN.y - y, LAB_SUN.x - x) / DEG + 90;
  return { x, y, turn };
};
