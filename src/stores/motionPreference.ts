/**
 * The motion preference's rules (P27-91): the device's reduced-motion setting, the
 * visitor's choice on the site, and how the two make one answer: calm or full motion.
 * A choice holds only while the device setting is the one it was made against (P27-93): turn
 * the setting on or off afterwards, and the site follows the device again.
 * No imports and no "use client": the server layout inlines MOTION_SCRIPT, and the store
 * (useMotion) uses the rest, so the first paint and the app always agree.
 */

/** The device's reduced-motion setting. */
export const MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** Where the visitor's choice is kept in this browser (the site's switch). */
export const MOTION_STORAGE_KEY = "p27.motion";

/**
 * The address's word for a choice the browser couldn't keep (storage blocked): the page
 * reloads into the other mode with `?motion=calm` (P27-93), and it wins over storage.
 */
export const MOTION_PARAM = "motion";

export const MOTION_CHOICES = ["calm", "full"] as const;
export type MotionChoice = (typeof MOTION_CHOICES)[number];

/** A value, if it's a known choice (anything else counts as no choice). */
export function parseChoice(raw: unknown): MotionChoice | null {
  return MOTION_CHOICES.find((choice) => choice === raw) ?? null;
}

/** The device setting, as it's kept with a choice. */
const deviceWord = (device: boolean) => (device ? "reduce" : "none");

/** What's kept for a choice: the choice and the device setting it was made against ("full:reduce"). */
export function storedChoice(choice: MotionChoice, device: boolean): string {
  return `${choice}:${deviceWord(device)}`;
}

/**
 * A kept choice, if it was made against this device setting. One made against the other
 * (the visitor has changed the setting since), an old one without it, or anything else
 * counts as no choice.
 */
export function parseStored(raw: unknown, device: boolean): MotionChoice | null {
  if (typeof raw !== "string") return null;
  const [choice, madeAgainst] = raw.split(":");
  return madeAgainst === deviceWord(device) ? parseChoice(choice) : null;
}

/** The choice an address carries (`?motion=calm`), if any. */
export function choiceInUrl(search: string): MotionChoice | null {
  return parseChoice(new URLSearchParams(search).get(MOTION_PARAM));
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
 * the device setting (no matchMedia: full motion), then a choice in the address, else the
 * kept one if it was made against this setting (blocked storage: no choice).
 */
export const MOTION_SCRIPT =
  "(function(){var c=null,d=false,s=null;" +
  `try{d=matchMedia(${JSON.stringify(MOTION_QUERY)}).matches}catch(e){}` +
  `try{c=new URLSearchParams(location.search).get(${JSON.stringify(MOTION_PARAM)})}catch(e){}` +
  `if(c!=="calm"&&c!=="full"){c=null;try{s=localStorage.getItem(${JSON.stringify(MOTION_STORAGE_KEY)})}catch(e){}` +
  `if(s===(d?${JSON.stringify(storedChoice("calm", true))}:${JSON.stringify(storedChoice("calm", false))}))c="calm";` +
  `else if(s===(d?${JSON.stringify(storedChoice("full", true))}:${JSON.stringify(storedChoice("full", false))}))c="full"}` +
  'document.documentElement.setAttribute("data-motion",c==="calm"||(c!=="full"&&d)?"calm":"full")})()';
