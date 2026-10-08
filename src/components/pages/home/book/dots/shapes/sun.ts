import type { Shape } from "#/components/pages/home/book/dots/dots.types";
import {
  DARK_PEACH,
  GOLDEN,
  LIGHT_PEACH,
  PEACH,
  WHITE,
} from "#/components/pages/home/book/dots/patterns";

/** The Lab's drawing frame (its SVG's viewBox), shared by the Sun's dots and the drawing over them. */
export const LAB_FRAME = { w: 500, h: 400 } as const;
/** The Lab's Sun, in that frame. */
export const LAB_SUN = { x: 130, y: 225, r: 58 } as const;

/** The Sun's rings of dots, from the middle to the rim. */
const RINGS = 13;

/**
 * The Lab's Sun, on a canvas under the Lab's 2D drawing, placed in that drawing's frame (as
 * the SVG fits it: centred, whole): round rings of dots from a white-hot middle to a dark
 * peach rim, unshaded; then a soft glow of fading peach dots, set a little apart so it stays
 * round. No sky: the drawing has its own stars.
 */
export const sun: Shape = (pen, { w, h, rnd }) => {
  const k = Math.min(w / LAB_FRAME.w, h / LAB_FRAME.h);
  const ox = (w - LAB_FRAME.w * k) / 2;
  const oy = (h - LAB_FRAME.h * k) / 2;
  const sx = ox + LAB_SUN.x * k;
  const sy = oy + LAB_SUN.y * k;
  const sunR = LAB_SUN.r * k;
  const step = sunR / RINGS;

  for (let i = 0; i <= RINGS; i++) {
    const r = i * step;
    const t = r / sunR;
    const n = i === 0 ? 1 : Math.round((2 * Math.PI * r) / step);
    const turn = rnd() * 2 * Math.PI;
    const [c, size] =
      t < 0.3
        ? [WHITE, 1.8]
        : t < 0.55
          ? [LIGHT_PEACH, 1.7]
          : t < 0.85
            ? [PEACH, 1.6]
            : [DARK_PEACH, 1.5];
    for (let j = 0; j < n; j++) {
      const a = turn + (j / n) * 2 * Math.PI;
      pen.dot(sx + Math.cos(a) * r, sy + Math.sin(a) * r, size * k, c, 1);
    }
  }

  const glowR = sunR * 2.1;
  const n = Math.round((Math.PI * glowR * glowR) / (18 * k * k));
  for (let i = 0; i < n; i++) {
    const r = glowR * Math.sqrt((i + 0.5) / n);
    const t = r / sunR;
    if (t < 1.15) continue;
    const f = (t - 1.15) / (glowR / sunR - 1.15);
    const o = 0.42 * (1 - f) ** 2;
    if (o < 0.04) continue;
    const a = i * GOLDEN;
    pen.dot(sx + Math.cos(a) * r, sy + Math.sin(a) * r, (1.3 - 0.5 * f) * k, PEACH, o);
  }
};
