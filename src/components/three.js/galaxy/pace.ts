import { JOURNEY } from "#/components/three.js/star/config";
import { remap01 } from "#/components/three.js/star/utils";
import { galaxyFlightEase } from "#/components/three.js/scene/storyMotion";
import { GALAXY_ZOOM } from "./config";

/**
 * The galaxy finale's PACING: how scrolling maps to the finale's progress (the
 * `useGalaxyScroll` value everything in the finale is keyed to — camera, fades,
 * reveal). See `JOURNEY.galaxyPace`:
 *
 *   Voyager ──glide to rest──▶ whole solar system ──hold──▶ ──ease in/out──▶ full galaxy
 *
 * The progress at the solar-system framing is `GALAXY_ZOOM.panSunEnd` (the camera's
 * hand-off from "aim at the Sun" to "aim at the galaxy centre").
 */

const P = JOURNEY.galaxyPace;
const TOTAL = P.toSolar + P.solarHold + P.toGalaxy;
const SOLAR = GALAXY_ZOOM.panSunEnd;

/** Galaxy progress (0..1) at a master journey progress `mp`. */
export function galaxyProgressAt(mp: number): number {
  const u = remap01(mp, JOURNEY.galaxyStart, JOURNEY.galaxyEnd) * TOTAL; // scroll % in
  // The pull-out: an even pace here; the camera's own distance curve (the story's
  // standard curve, CameraRig segment 4) eases it slow → fast → slow.
  if (u <= P.toSolar) return SOLAR * (u / P.toSolar);
  if (u <= P.toSolar + P.solarHold) return SOLAR;
  // The flight out to the galaxy: its own curve, slow → normal → very slow (P27-77).
  return SOLAR + (1 - SOLAR) * galaxyFlightEase((u - P.toSolar - P.solarHold) / P.toGalaxy);
}

/**
 * Where the finale rests on the whole solar system: the master progress [start, end] of
 * the hold between the pull-out and the flight to the galaxy.
 */
export function solarRestRange(): [number, number] {
  const at = (u: number) =>
    JOURNEY.galaxyStart + (u / TOTAL) * (JOURNEY.galaxyEnd - JOURNEY.galaxyStart);
  return [at(P.toSolar), at(P.toSolar + P.solarHold)];
}

/**
 * The inverse (for the dev panel's "jump to"): the master progress where the galaxy
 * progress reaches `g`. At the solar system itself it lands mid-hold.
 */
export function journeyAtGalaxy(g: number): number {
  const at = (u: number) =>
    JOURNEY.galaxyStart + (u / TOTAL) * (JOURNEY.galaxyEnd - JOURNEY.galaxyStart);
  if (Math.abs(g - SOLAR) < 1e-6) return at(P.toSolar + P.solarHold / 2);
  // Both legs are monotonic → bisect the scroll.
  let lo = 0;
  let hi = TOTAL;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (galaxyProgressAt(at(mid)) < g) lo = mid;
    else hi = mid;
  }
  return at(hi);
}
