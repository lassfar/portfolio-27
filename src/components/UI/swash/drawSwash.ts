import gsap from "gsap";

/**
 * How a swash's line is hidden and drawn (P27-83). Its path's length is 1 and its dash
 * "1 2" (a dash of 1, then a gap longer than the path): at offset 0 it's drawn, at
 * HIDDEN it's gone — just past 1, so the round cap at the dash's end doesn't leave a dot
 * at the start.
 */
const HIDDEN = 1.01;

/**
 * The draw, everywhere: 1.2s, easing out (GSAP's power4 = quint). `autoRound: false`:
 * GSAP rounds px values by default, and the offset runs from ~1 to 0 — rounded, the line
 * would just appear halfway through.
 */
const SWASH_DRAW = { duration: 1.2, ease: "power4.out", autoRound: false } as const;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const strokeOf = (swash: Element | null) => swash?.querySelector("path") ?? null;

/** Hides a swash's line until something draws it. With reduced motion it stays drawn. */
export function hideSwash(swash: Element | null): void {
  const stroke = strokeOf(swash);
  if (stroke && !reducedMotion()) gsap.set(stroke, { strokeDashoffset: HIDDEN });
}

/**
 * Draws a swash's line in on its own, after `delay` seconds — a swash that isn't part of
 * a timeline (`Swash draw="mount"`, e.g. "Thank you"). With reduced motion it's shown.
 */
export function drawSwash(swash: Element | null, delay = 0): void {
  const stroke = strokeOf(swash);
  if (!stroke) return;
  if (reducedMotion()) gsap.set(stroke, { strokeDashoffset: 0 });
  else gsap.fromTo(stroke, { strokeDashoffset: HIDDEN }, { strokeDashoffset: 0, ...SWASH_DRAW, delay });
}

/**
 * Adds a swash's draw to a GSAP timeline at `position` — as a step of its content's own
 * animation (a section title's write-in, a panel's entrance), so it plays and reverses
 * with it. With reduced motion it's left drawn.
 */
export function addSwashDraw(
  timeline: gsap.core.Timeline,
  swash: Element | null,
  position?: gsap.Position,
): gsap.core.Timeline {
  const stroke = strokeOf(swash);
  if (!stroke || reducedMotion()) return timeline;
  return timeline.fromTo(stroke, { strokeDashoffset: HIDDEN }, { strokeDashoffset: 0, ...SWASH_DRAW }, position);
}
