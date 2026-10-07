import { jumpToJourney } from "#/components/pages/home/scroll/glide";
import { JOURNEY } from "#/components/three.js/star/config";

/**
 * Helpers shared by the dev tuning panel's sections (GalaxyGui, SunGui, PlanetGui).
 */

/** Scroll to a point of the pinned journey (master progress 0..1). */
export { jumpToJourney };

/** Scroll to a point of the voyage (0 = leaving the Saturn → 1 = the Earth). */
export function jumpToVoyage(v: number) {
  jumpToJourney(JOURNEY.flyAwayStart + v * (JOURNEY.voyageEnd - JOURNEY.flyAwayStart));
}

/** Briefly relabel a button (feedback), then restore it. */
export function flash(
  controller: { name: (label: string) => unknown },
  label: string,
  restore: string,
) {
  controller.name(label);
  window.setTimeout(() => controller.name(restore), 1600);
}

/** Copy `json` to the clipboard (or log it when that's blocked), with feedback on the button. */
export function copyValues(
  controller: { name: (label: string) => unknown },
  json: string,
  label: string,
  tag: string,
) {
  navigator.clipboard
    .writeText(json)
    .then(() => flash(controller, "copied ✓", label))
    .catch(() => {
      console.info(`[${tag}] current values:\n` + json);
      flash(controller, "copy blocked — logged to console", label);
    });
}
