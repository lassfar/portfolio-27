import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import type { ChapterId } from "#/components/pages/home/story/story.types";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { restOf } from "./chapters";
import { jumpToJourney, stopGlide } from "./glide";

/** Whether the pinned journey is in place, with its smoother: a landing can go. */
export const journeyReady = (): boolean => !!journeyTrigger.current && !!ScrollSmoother.get();

/**
 * Waits for the pinned journey (P27-94: it mounts behind the mode switch's veil), checking on
 * each frame. Checked, not signalled: in development React builds the pin twice in one go,
 * and a signal would fire on the first, about to be reverted. Resolves whether it came within
 * `timeout` ms; false at once if `signal` aborts.
 */
export function waitForJourney(timeout: number, signal?: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const until = performance.now() + timeout;
    const check = () => {
      if (signal?.aborted) resolve(false);
      else if (journeyReady()) resolve(true);
      else if (performance.now() >= until) resolve(false);
      else requestAnimationFrame(check);
    };
    check();
  });
}

/**
 * Lands the journey on chapter `id`'s resting view at once (P27-94: the mode switch), the
 * scrubbed story there too rather than catching up behind. Returns whether it could (not
 * without the pinned journey).
 */
export function landJourney(id: ChapterId): boolean {
  const trigger = journeyTrigger.current;
  if (!trigger || !ScrollSmoother.get()) return false;
  stopGlide();
  if (!jumpToJourney(restOf(id))) return false;
  trigger.update();
  trigger.getTween()?.progress(1);
  return true;
}

/**
 * Keeps the journey on chapter `id` while the page settles (the 3D loading, a resize): each
 * ScrollTrigger refresh lands it again. Returns the stop.
 */
export function holdJourneyOn(id: ChapterId): () => void {
  const land = () => void landJourney(id);
  ScrollTrigger.addEventListener("refresh", land);
  return () => ScrollTrigger.removeEventListener("refresh", land);
}
