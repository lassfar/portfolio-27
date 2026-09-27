import { clamp01, remap01 } from "#/components/three.js/star/utils";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { useLabScroll } from "#/stores/useLabScroll";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { VOYAGE } from "#/components/three.js/solar/config";
import { LAB } from "#/components/three.js/voyager/config";

/** Earth-approach progress (0..1) — the globe reveals + becomes draggable here. */
export const earthApproach = (): number =>
  remap01(clamp01(useVoyageScroll.getState().progress), VOYAGE.flyoutEnd, 1);

/**
 * True while the Earth is the interactive focus and should OWN pointer-drag —
 * so a drag spins the GLOBE itself, not the whole scene (unlike every other body,
 * which turns with the shared scene rotation). The Earth takes the drag once it's
 * substantially in view (approach ≥ 0.4) and holds it until the Lab pulls away and
 * the Earth has faded (lab ≥ LAB.earthFadeEnd), after which the scene (Voyager)
 * owns drag again. Read by BOTH the globe (to spin) and Universe (to stand down),
 * so the two never rotate at once.
 */
export const earthOwnsDrag = (): boolean =>
  earthApproach() >= 0.4 &&
  clamp01(useLabScroll.getState().progress) < LAB.earthFadeEnd;

/**
 * What the CURRENT pointer-drag controls, decided on pointer-DOWN by a hit-test
 * against the globe (see DottedEarth's onDown):
 *   • "globe" — the down grabbed the Earth while it's the focus → spin the GLOBE
 *     only; Universe stands down so the space stays put.
 *   • "probe" — at the Parker Solar Probe's close-up (probeOwnsDrag) → turn the probe
 *     and the space together, like the Saturn (ParkerProbe circles the camera round
 *     it); Universe stands down.
 *   • "scene" — otherwise → rotate the whole cosmos (Universe); the Earth turns WITH
 *     it, like every other body (Saturn).
 * Shared so the globe and Universe always agree and never both move at once.
 */
export const dragMode: { current: "globe" | "scene" | "probe" } = { current: "scene" };

/**
 * True while the Lab rests at the Parker Solar Probe's close-up: a drag there ORBITS the
 * camera round the probe ("probe" — the probe stays put, the Sun, stars and planets turn
 * round it), so it can be seen from any angle; Universe stands down.
 */
export const probeOwnsDrag = (): boolean =>
  clamp01(useLabScroll.getState().progress) >= LAB.recordLabelAt &&
  clamp01(useGalaxyScroll.getState().progress) <= 0.001;
