import { ScrollSmoother } from "gsap/all";
import { JOURNEY } from "#/components/three.js/star/config";
import { journeyTrigger } from "#/stores/journeyTrigger";

/**
 * Helpers shared by the dev tuning panel's sections (GalaxyGui, SunGui, PlanetGui).
 */

/** Scroll to a point of the pinned journey (master progress 0..1). */
export function jumpToJourney(mp: number) {
  const trigger = journeyTrigger.current;
  if (!trigger) return;
  const y = trigger.start + mp * (trigger.end - trigger.start);
  const smoother = ScrollSmoother.get();
  if (smoother) smoother.scrollTo(y, false);
  else window.scrollTo(0, y);
}

/** Scroll to a point of the voyage (0 = leaving the Saturn → 1 = the Earth). */
export function jumpToVoyage(v: number) {
  jumpToJourney(JOURNEY.flyAwayStart + v * (JOURNEY.voyageEnd - JOURNEY.flyAwayStart));
}

/** Briefly relabel a button (feedback), then restore it. */
export function flash(controller: { name: (label: string) => unknown }, label: string, restore: string) {
  controller.name(label);
  window.setTimeout(() => controller.name(restore), 1600);
}

/** Copy `json` to the clipboard (or log it when that's blocked), with feedback on the button. */
export function copyValues(
  controller: { name: (label: string) => unknown },
  json: string,
  label: string,
  tag: string
) {
  navigator.clipboard
    .writeText(json)
    .then(() => flash(controller, "copied ✓", label))
    .catch(() => {
      console.info(`[${tag}] current values:\n` + json);
      flash(controller, "copy blocked — logged to console", label);
    });
}
