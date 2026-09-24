import { JOURNEY } from "#/components/three.js/star/config";
import { remap01 } from "#/components/three.js/star/utils";
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

/** Cubic from `speed` (× the average rate) at the start to REST at the end. */
function glideToRest(t: number, speed: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return speed * (t - 2 * t2 + t3) + (3 * t2 - 2 * t3);
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Galaxy progress (0..1) at a master journey progress `mp`. */
export function galaxyProgressAt(mp: number): number {
  const u = remap01(mp, JOURNEY.galaxyStart, JOURNEY.galaxyEnd) * TOTAL; // scroll % in
  if (u <= P.toSolar) return SOLAR * glideToRest(u / P.toSolar, P.departSpeed);
  if (u <= P.toSolar + P.solarHold) return SOLAR;
  return SOLAR + (1 - SOLAR) * smoothstep((u - P.toSolar - P.solarHold) / P.toGalaxy);
}

/**
 * The inverse (for the dev panel's "jump to"): the master progress where the galaxy
 * progress reaches `g`. At the solar system itself it lands mid-hold.
 */
export function journeyAtGalaxy(g: number): number {
  const at = (u: number) => JOURNEY.galaxyStart + (u / TOTAL) * (JOURNEY.galaxyEnd - JOURNEY.galaxyStart);
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
