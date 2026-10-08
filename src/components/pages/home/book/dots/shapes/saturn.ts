import type { Shape } from "#/components/pages/home/book/dots/dots.types";
import {
  DARK_PEACH,
  LIGHT_PEACH,
  PEACH,
  disc,
  discCount,
  sky,
} from "#/components/pages/home/book/dots/patterns";

const TILT = -0.32;
const FLAT = 0.27;
/** The rings' radii, in planet radii; the outer three are light peach. */
const RINGS = [1.3, 1.4, 1.5, 1.6, 1.7, 1.88, 1.98, 2.08];
/** The planet's dots, at most (it stays light on a big screen). */
const MAX_PLANET_DOTS = 3000;

/**
 * The Maker: Saturn, made of its dust. Peach bands lit from the upper left, its rings tilted
 * around it: the back half behind the planet, the front half over it.
 */
export const saturn: Shape = (pen, { w, h, rnd }) => {
  sky(pen, w, h, rnd, 0.8);
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.24;
  const place = (x: number, y: number) => [
    cx + x * Math.cos(TILT) - y * Math.sin(TILT),
    cy + x * Math.sin(TILT) + y * Math.cos(TILT),
  ];

  const rings = (front: boolean) =>
    RINGS.forEach((k, j) => {
      const n = Math.round((2 * Math.PI * R * k) / 5.2);
      for (let i = 0; i < n; i++) {
        const t = (i / n) * 2 * Math.PI + j;
        const s = Math.sin(t);
        if (s >= 0 !== front) continue;
        const lx = Math.cos(t) * R * k;
        const ly = s * R * k * FLAT;
        // The back half is hidden where the planet stands in front of it.
        if (!front && lx * lx + ly * ly < R * R) continue;
        const [x, y] = place(lx, ly);
        const outer = k > 1.8;
        pen.dot(
          x,
          y,
          1.1 + rnd() * 0.3,
          outer ? LIGHT_PEACH : PEACH,
          (front ? 0.78 : 0.4) * (outer ? 0.8 : 1),
        );
      }
    });

  rings(false);
  disc(pen, cx, cy, R, Math.min(MAX_PLANET_DOTS, discCount(R)), (x, y) => {
    const dx = (x - cx) / R;
    const dy = (y - cy) / R;
    const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
    const lx = dx * Math.cos(TILT) + dy * Math.sin(TILT);
    const ly = -dx * Math.sin(TILT) + dy * Math.cos(TILT);
    const band = Math.sin(ly * 9 + Math.sin(lx * 3) * 0.5);
    const light = Math.min(1, Math.max(0, -dx * 0.45 - dy * 0.55 + nz * 0.75));
    return {
      r: 1.55,
      c: band > 0.45 ? DARK_PEACH : band < -0.55 ? LIGHT_PEACH : PEACH,
      a: 0.16 + 0.84 * light,
    };
  });
  rings(true);
};
