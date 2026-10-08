import { MOTION_PARAM, MOTION_STORAGE_KEY, type MotionChoice } from "#/stores/motionPreference";

/**
 * The address to reload into `mode` (P27-93): the same page, at the top of the other mode,
 * so without its `#chapter`. When the browser couldn't keep the choice (`kept` false: storage
 * blocked), the address carries it (`?motion=calm`); otherwise it doesn't.
 */
export function reloadAddress(href: string, mode: MotionChoice, kept: boolean): string {
  const url = new URL(href);
  // Touched only when needed: rewriting the query would turn `?perf` into `?perf=`.
  if (!kept) url.searchParams.set(MOTION_PARAM, mode);
  else if (url.searchParams.has(MOTION_PARAM)) url.searchParams.delete(MOTION_PARAM);
  return url.pathname + url.search;
}

/** Whether this browser kept the visitor's choice (it can't when storage is blocked). */
export function choiceKept(mode: MotionChoice): boolean {
  try {
    return localStorage.getItem(MOTION_STORAGE_KEY) === mode;
  } catch {
    return false;
  }
}
