/**
 * The motion preference's rules (P27-91): the device's reduced-motion setting, the
 * visitor's choice on the site, and how the two make one answer: calm or full motion.
 * No imports and no "use client": the server layout inlines MOTION_SCRIPT, and the store
 * (useMotion) uses the rest, so the first paint and the app always agree.
 */

/** The device's reduced-motion setting. */
export const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Where the visitor's choice is kept in this browser (the site's switch). */
export const MOTION_STORAGE_KEY = "p27.motion";

export const MOTION_CHOICES = ["calm", "full"] as const;
export type MotionChoice = (typeof MOTION_CHOICES)[number];

/** A stored value, if it's a known choice (anything else counts as no choice). */
export function parseChoice(raw: unknown): MotionChoice | null {
  return MOTION_CHOICES.find((choice) => choice === raw) ?? null;
}

/** Calm or not: the visitor's choice wins; without one, the device setting decides. */
export function resolveCalm(choice: MotionChoice | null, device: boolean): boolean {
  return choice ? choice === "calm" : device;
}

/** The value of `data-motion` on <html>. */
export function motionMode(calm: boolean): MotionChoice {
  return calm ? "calm" : "full";
}

/**
 * Runs in <head> before the first paint: marks <html> with `data-motion` by the same
 * rules, so CSS knows the mode before any of the app loads. Plain ES5, every read guarded:
 * blocked storage counts as no choice, no matchMedia as full motion.
 */
export const MOTION_SCRIPT =
  "(function(){var c=null,d=false;" +
  `try{c=localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)})}catch(e){}` +
  `try{d=matchMedia(${JSON.stringify(MOTION_QUERY)}).matches}catch(e){}` +
  'document.documentElement.setAttribute("data-motion",c==="calm"||(c!=="full"&&d)?"calm":"full")})()';
