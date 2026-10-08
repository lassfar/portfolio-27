import type { Shape } from "#/components/pages/home/book/dots/dots.types";
import { BOOK } from "#/components/pages/home/story/copy";
import {
  BLUE,
  LIGHT_BLUE,
  LIGHT_PEACH,
  PEACH,
  WHITE,
  gauss,
  sky,
} from "#/components/pages/home/book/dots/patterns";

const TILT = -0.35;
const FLAT = 0.6;
/** The arms' tightness: a logarithmic spiral, angle = ln(r / r0) / PITCH. */
const PITCH = 0.3;

/**
 * The Milky Way: a faint haze, four arms (two main, two minor) peach near the middle and blue
 * further out, a warm bulge, and one dot marked "You are here".
 */
export const galaxy: Shape = (pen, { w, h, rnd }) => {
  sky(pen, w, h, rnd, 0.6);
  const cx = w / 2;
  const cy = h / 2;
  const Rg = Math.min(w, h) * 0.46;
  const r0 = Rg * 0.1;
  const place = (r: number, a: number) => {
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r * FLAT;
    return [
      cx + x * Math.cos(TILT) - y * Math.sin(TILT),
      cy + x * Math.sin(TILT) + y * Math.cos(TILT),
    ];
  };

  for (let i = 0; i < 1400; i++) {
    const [x, y] = place(Rg * Math.sqrt(rnd()), rnd() * 2 * Math.PI);
    pen.dot(x, y, 0.5 + rnd() * 0.5, rnd() < 0.5 ? LIGHT_BLUE : WHITE, 0.05 + rnd() * 0.12);
  }
  for (let arm = 0; arm < 4; arm++) {
    const main = arm % 2 === 0;
    const n = main ? 1800 : 1000;
    for (let i = 0; i < n; i++) {
      const t = Math.pow(rnd(), 0.85);
      const r = r0 + t * (Rg - r0);
      const a = (arm * Math.PI) / 2 + Math.log(r / r0) / PITCH + gauss(rnd) * (0.14 + 0.1 * t);
      const [x, y] = place(r + gauss(rnd) * Rg * 0.022, a);
      pen.dot(
        x,
        y,
        0.5 + rnd() * 0.8,
        rnd() < (1 - t) * 0.85 ? PEACH : rnd() < 0.55 ? LIGHT_BLUE : BLUE,
        (0.18 + rnd() * 0.55) * (main ? 1 : 0.75),
      );
    }
  }
  for (let i = 0; i < 1200; i++) {
    const [x, y] = place(Math.abs(gauss(rnd)) * Rg * 0.09, rnd() * 2 * Math.PI);
    pen.dot(x, y, 0.7 + rnd() * 0.6, rnd() < 0.5 ? LIGHT_PEACH : PEACH, 0.5 + rnd() * 0.45);
  }

  // You: on a main arm, a little over halfway out.
  const yr = Rg * 0.62;
  const [yx, yy] = place(yr, Math.PI / 2 + Math.log(yr / r0) / PITCH + 0.2);
  pen.dot(yx, yy, 2.2, LIGHT_PEACH, 1);
  pen.mark({ kind: "ring", x: yx, y: yy, r: 7 });
  pen.mark({ kind: "line", x1: yx + 6, y1: yy + 6, x2: yx + 30, y2: yy + 30 });
  pen.mark({ kind: "label", x: yx + 34, y: yy + 38, text: BOOK.youAreHere, anchor: "start" });
};
