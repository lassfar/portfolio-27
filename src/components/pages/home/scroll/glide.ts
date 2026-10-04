import gsap from "gsap";
import { ScrollSmoother } from "gsap/all";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { isScrollLocked } from "#/stores/scrollLock";
import { useGlide, type GlideSource } from "#/stores/useGlide";

/**
 * Glide the smooth scroll to a point of the pinned journey (master progress 0..1): a
 * tween of ScrollSmoother's `scrollTop`, so the whole story plays on the way. Does
 * nothing while a panel holds the scroll. Who started it (`by`) is published in
 * useGlide while it runs. Returns whether it started.
 */
export function glideToJourney(
  mp: number,
  seconds: number,
  ease = "power3.inOut",
  by?: GlideSource,
): boolean {
  const trigger = journeyTrigger.current;
  if (!trigger || isScrollLocked()) return false;
  const y = trigger.start + mp * (trigger.end - trigger.start);
  const smoother = ScrollSmoother.get();
  if (!smoother) {
    window.scrollTo({ top: y, behavior: "smooth" });
    return true;
  }
  const done = () => useGlide.getState().setBy(null);
  // (Starting it interrupts any glide before it — its `done` runs first.)
  gsap.to(smoother, { scrollTop: y, duration: seconds, ease, overwrite: true, onComplete: done, onInterrupt: done });
  useGlide.getState().setBy(by ?? null);
  return true;
}

/** Stop a glide: the visitor takes the scroll back. */
export function stopGlide(): void {
  const smoother = ScrollSmoother.get();
  if (smoother) gsap.killTweensOf(smoother, "scrollTop");
}

let inputUsers = 0; // components that asked for stopGlideOnInput (the listeners are shared)

/**
 * A wheel, touch or key press takes the scroll back from a glide. Several components can
 * ask for it (the timeline, the phase buttons): the listeners go on with the first and
 * off with the last. Returns the cleanup (for a useEffect).
 */
export function stopGlideOnInput(): () => void {
  if (inputUsers++ === 0) {
    window.addEventListener("wheel", stopGlide, { passive: true });
    window.addEventListener("touchstart", stopGlide, { passive: true });
    window.addEventListener("keydown", stopGlide);
  }
  return () => {
    if (--inputUsers > 0) return;
    window.removeEventListener("wheel", stopGlide);
    window.removeEventListener("touchstart", stopGlide);
    window.removeEventListener("keydown", stopGlide);
  };
}
