import type { Pen } from "#/components/pages/home/book/dots/dots.types";

/*
 * The dots' colours: the site's tokens (globals.css @theme), as a canvas needs them, plus
 * the star's warm in-betweens (P27-65's prototype).
 */
export const WHITE = "#ffffff";
export const PEACH = "#ffa14a";
export const DARK_PEACH = "#ef7d14";
export const LIGHT_PEACH = "#ffe3c7";
export const BLUE = "#2489ff";
export const LIGHT_BLUE = "#c5e0ff";
export const SLATE = "#d9d9d9";
/** The star's core, warming from white, and its sparkle's warm greys. */
export const WARM_WHITE = "#fff1de";
export const WARM_GREY = "#f3e6d6";
export const SOFT_GREY = "#d8c8b6";
/** The star's golden gas. */
export const GOLD = "#ffc27a";

export const DEG = Math.PI / 180;
/** The golden angle: consecutive dots of a sunflower never line up. */
export const GOLDEN = 2.39996;
/** The area each dot of an even pattern gets (px²): about 5.5 px apart. */
export const DOT_AREA = 30;

/** A seeded random generator (mulberry32): the same seed gives the same shape every time. */
export const seeded = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** A normal distribution (Box–Muller), from the seeded generator. */
export const gauss = (rnd: () => number) =>
  Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());

/** A string's seed. */
export const hash = (s: string) =>
  [...s].reduce((h, ch) => (Math.imul(h, 31) + ch.charCodeAt(0)) | 0, 7);

/** A faint field of stars, fading out near the edges so the canvas has no visible border. */
export const sky = (pen: Pen, w: number, h: number, rnd: () => number, density = 1) => {
  const n = Math.round(((w * h) / 4200) * density);
  for (let i = 0; i < n; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const edge = Math.min(1, Math.min(x, w - x, y, h - y) / 70);
    pen.dot(x, y, 0.4 + rnd() * 0.7, WHITE, (0.1 + rnd() * 0.35) * edge);
  }
};

/** A dot's look, or `null` to leave it out. */
export type DotStyle = { r: number; c: string; a: number } | null;

/**
 * Dots spread evenly over a disc, a sunflower: `n` dots, the i-th at radius R·√((i+½)/n),
 * turned by the golden angle. `style` gets each spot (and its distance from the centre, 0–1).
 */
export const disc = (
  pen: Pen,
  cx: number,
  cy: number,
  R: number,
  n: number,
  style: (x: number, y: number, t: number) => DotStyle,
) => {
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const r = R * Math.sqrt(t);
    const a = i * GOLDEN;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    const s = style(x, y, r / R);
    if (s) pen.dot(x, y, s.r, s.c, s.a);
  }
};

/** How many dots fill a disc of radius R in the even pattern. */
export const discCount = (R: number) => Math.round((Math.PI * R * R) / DOT_AREA);
