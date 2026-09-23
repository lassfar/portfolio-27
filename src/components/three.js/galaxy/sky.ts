import { Matrix4, Quaternion, Vector3 } from "three";
import { GALAXY_ZOOM } from "./config";

/**
 * The SKY frame — the space around the galaxy (deep stars, distant galaxies,
 * sparkles). It's infinitely far: pinned to the camera (no parallax during the zoom)
 * and oriented like the camera of the END view, so things laid out in that view's
 * camera space land exactly on their designed spots when the whole spiral is framed.
 * A drag turns it with the galaxy (`galaxyDrag`) — see `Galaxy.tsx`.
 */

/** Distance of the sky from the camera (inside the camera's far plane). */
export const SKY_RADIUS = 1000;

/** The END view's camera orientation (looking at the galaxy from `GALAXY_ZOOM.endDir`, upright). */
export const SKY_END_VIEW = new Quaternion().setFromRotationMatrix(
  new Matrix4().lookAt(
    new Vector3(...GALAXY_ZOOM.endDir),
    new Vector3(0, 0, 0),
    new Vector3(0, 1, 0)
  )
);

/** Small seeded RNG, so the sky is the same on every visit. */
export function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
