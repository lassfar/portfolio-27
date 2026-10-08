import type { Shape } from "#/components/pages/home/book/dots/dots.types";
import {
  DARK_PEACH,
  GOLD,
  LIGHT_PEACH,
  PEACH,
  SOFT_GREY,
  WARM_GREY,
  WARM_WHITE,
  WHITE,
  disc,
  discCount,
  sky,
} from "#/components/pages/home/book/dots/patterns";

/**
 * Origin: the star before it bursts. A white-hot core warming to light peach, golden peach
 * gas fading out, a faint dark peach glow, and four long, thin sparkle points of white and
 * warm grey. No blue. In the same even pattern as Saturn and the Earth.
 */
export const star: Shape = (pen, { w, h, rnd, viewportHeight }) => {
  sky(pen, w, h, rnd, 1.2);
  // Sized from the screen, not the cover: the words sit below it.
  const vh = Math.min(h, viewportHeight);
  // A short screen (a phone held sideways, P27-95): smaller and higher, the title under it.
  const short = viewportHeight < 500;
  const phone = w < 768;
  const cx = w / 2;
  const cy = vh * (short ? 0.24 : phone ? 0.28 : 0.34);
  const A = Math.min(w, vh) * (short ? 0.3 : phone ? 0.44 : 0.34);
  // The sparkle: a four-point star with thin curved sides, |x|^0.4 + |y|^0.4 = A^0.4.
  const sparkle = (dx: number, dy: number) =>
    (Math.abs(dx) ** 0.4 + Math.abs(dy) ** 0.4) ** 2.5 / A;

  disc(pen, cx, cy, A, discCount(A), (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    const t = Math.hypot(dx, dy) / A + (rnd() - 0.5) * 0.03;
    if (t < 0.07) return { r: 2.1, c: WHITE, a: 1 };
    if (t < 0.12) return { r: 1.9, c: WARM_WHITE, a: 0.97 };
    if (t < 0.17) return { r: 1.7, c: LIGHT_PEACH, a: 0.92 };
    const sp = sparkle(dx, dy) + (rnd() - 0.5) * 0.06;
    if (sp < 1) {
      const fall = Math.min(1, (t - 0.17) / 0.83);
      return {
        r: 1.6 - 0.5 * fall,
        c: sp < 0.3 ? WHITE : sp < 0.6 ? WARM_GREY : SOFT_GREY,
        a: (0.95 - 0.6 * fall) * (sp < 0.85 ? 1 : 1 - (sp - 0.85) * 3),
      };
    }
    if (t < 0.55) {
      const k = (t - 0.17) / 0.38;
      const warm = rnd();
      return {
        r: 1.7 - 0.6 * k,
        c: k < 0.35 ? (warm < 0.5 ? GOLD : PEACH) : warm < 0.3 * (1 - k) ? DARK_PEACH : PEACH,
        a: 1 - 0.88 * k ** 1.5,
      };
    }
    const glow = 0.3 * (1 - (t - 0.55) / 0.2);
    return glow > 0.04 ? { r: 1.1, c: DARK_PEACH, a: glow } : null;
  });
};
