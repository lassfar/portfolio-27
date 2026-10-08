import { create } from "zustand";
import {
  MOTION_QUERY,
  MOTION_STORAGE_KEY,
  choiceInUrl,
  motionMode,
  parseStored,
  resolveCalm,
  storedChoice,
  type MotionChoice,
} from "./motionPreference";

/**
 * The visitor's motion preference for the whole site (P27-91): calm or full. The device's
 * reduced-motion setting, followed live, unless the visitor chose on the site (kept in
 * this browser, with the device setting it was made against: once that setting changes,
 * the choice goes, P27-93). Mirrored as `data-motion` on <html> for CSS: MOTION_SCRIPT sets it before
 * the first paint, and the store keeps it in sync.
 *
 * The state starts as the server renders it (no reduced motion, no choice) and its
 * initial value never changes: zustand renders the hydration pass from it, so it always
 * matches. The real values arrive just after, from `start` below.
 */
type MotionState = {
  /** The device asks for reduced motion. */
  device: boolean;
  /** The visitor's choice on the site, if any. */
  choice: MotionChoice | null;
  setChoice: (choice: MotionChoice | null) => void;
};

export const useMotion = create<MotionState>((set, get) => ({
  device: false,
  choice: null,
  setChoice: (choice) => {
    try {
      if (choice) localStorage.setItem(MOTION_STORAGE_KEY, storedChoice(choice, get().device));
      else localStorage.removeItem(MOTION_STORAGE_KEY);
    } catch {
      // Storage blocked (private mode…): the choice still applies until reload.
    }
    // The same choice again notifies no one.
    set((s) => (s.choice === choice ? s : { choice }));
  },
}));

export const selectCalm = (s: MotionState) => resolveCalm(s.choice, s.device);

/** Calm or not, now: for code outside React (a GSAP build, a one-shot read). */
export const isCalm = () => selectCalm(useMotion.getState());

/** Calm or not, live: the component re-renders when it changes. */
export const useCalm = () => useMotion(selectCalm);

/**
 * In the browser, as soon as this module loads (so before any component reads it): the
 * device setting and the visitor's choice (the address's, or the kept one if it still
 * holds), the setting followed live, and `data-motion` on <html> kept in sync. A kept
 * choice that no longer holds is cleared.
 */
function start(): void {
  let query: MediaQueryList | null = null;
  try {
    query = window.matchMedia(MOTION_QUERY);
  } catch {
    // No matchMedia: the device setting counts as full motion.
  }
  const device = query?.matches ?? false;
  let kept: MotionChoice | null = null;
  try {
    const stored = localStorage.getItem(MOTION_STORAGE_KEY);
    kept = parseStored(stored, device);
    // Made against the other device setting (changed since), or an old one: it goes.
    if (stored !== null && kept === null) localStorage.removeItem(MOTION_STORAGE_KEY);
  } catch {
    // Storage blocked: no choice.
  }
  useMotion.setState({ device, choice: choiceInUrl(window.location.search) ?? kept });
  query?.addEventListener("change", (event) => useMotion.setState({ device: event.matches }));

  const mirror = () => document.documentElement.setAttribute("data-motion", motionMode(isCalm()));
  mirror();
  useMotion.subscribe(mirror);
}

if (typeof window !== "undefined") start();
