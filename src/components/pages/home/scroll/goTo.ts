import { glideSeconds } from "#/components/pages/home/phase-nav/config";
import type { ChapterId } from "#/components/pages/home/story/story.types";
import { isScrollLocked } from "#/stores/scrollLock";
import type { GlideSource } from "#/stores/useGlide";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { restOf } from "./chapters";
import { glideToJourney, jumpToJourney, stopGlide } from "./glide";

export type GoToOptions =
  { instant: true } | { instant?: false; seconds?: number; ease?: string; by?: GlideSource };

/**
 * Takes the visitor to chapter `id`, on its resting view (P27-91): the one way a chapter
 * navigation moves the journey (a timeline star, the assistant's button, the hero's "To
 * wander", the dev panel's jumps).
 *
 * It glides there, the story playing on the way, at the assistant's pace (the distance
 * sets the time, unless `seconds` is given); or it jumps (`instant`). Returns whether it
 * moved: never without the pinned journey (reduced motion), nor while a panel holds the scroll.
 */
export function goTo(id: ChapterId, options: GoToOptions = {}): boolean {
  const rest = restOf(id);
  if (options.instant) {
    if (isScrollLocked()) return false;
    stopGlide();
    return jumpToJourney(rest);
  }
  const seconds = options.seconds ?? glideSeconds(rest - useJourneyScroll.getState().progress);
  return glideToJourney(rest, seconds, options.ease, options.by);
}
