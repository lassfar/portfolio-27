import gsap from "gsap";
import { ScrollSmoother } from "gsap/all";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { isScrollLocked } from "#/stores/scrollLock";
import { useGlide, type GlideSource } from "#/stores/useGlide";

let current: gsap.core.Tween | null = null; // the glide running, if any

/** A glide ended (done, or interrupted): unless another has replaced it, none is running. */
function end(tween: gsap.core.Tween): void {
  if (current !== tween) return;
  current = null;
  useGlide.getState().setBy(null);
}

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
  // It replaces any glide before it (`overwrite`): that one's `end` then changes nothing, so
  // `by` goes straight from one glide to the next, never through "none".
  current = null;
  const tween: gsap.core.Tween = gsap.to(smoother, {
    scrollTop: y,
    duration: seconds,
    ease,
    overwrite: true,
    onComplete: () => end(tween),
    onInterrupt: () => end(tween),
  });
  current = tween;
  useGlide.getState().setBy(by ?? null);
  return true;
}

/**
 * Stop a glide: the visitor takes the scroll back. The whole tween is killed (not just its
 * `scrollTop`): a per-property kill only fires `onInterrupt` once the tween has started, so a
 * wheel in the click's own frame would have left the glide "running" until its end.
 */
export function stopGlide(): void {
  const smoother = ScrollSmoother.get();
  if (smoother) gsap.killTweensOf(smoother);
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
