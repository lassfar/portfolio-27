import { Euler, Vector3 } from "three";
import { clamp01 } from "#/components/three.js/star/utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { GALAXY, GALAXY_CENTER, GALAXY_TILT, SUN_ARM_RADIUS } from "./config";

/**
 * The solar system "flying" through the galaxy at the finale.
 *
 * The whole real solar system revolves about the galactic centre at the galaxy's own
 * spin rate — drifting through its arm, alive, instead of sitting frozen. The revolve
 * happens in the tilted disc plane (about the disc normal), and PERSISTS the whole
 * time the finale is on-screen: the camera is anchored on the live Sun position, so
 * scrolling back zooms into the solar system wherever it has flown to. It only resets
 * once we're back below `GALAXY.flyResetBelow` (the system is hidden there, so the
 * reset is invisible), giving each fresh entry a clean start at `SUNPOS`.
 */

/** Live fly angle (rad) about the disc normal. Advanced by the Galaxy each frame. */
export const galaxySpin = { solar: 0 };

/** Advance (or reset) the solar fly angle. Called once per frame by the Galaxy. */
export function advanceSolarFly(delta: number, animate: boolean): void {
  const g = clamp01(useGalaxyScroll.getState().progress);
  if (g < GALAXY.flyResetBelow) {
    galaxySpin.solar = 0; // back at the Voyager: reset (the system is hidden here)
    return;
  }
  if (animate) galaxySpin.solar += GALAXY.spinSpeed * delta;
}

const _tiltEuler = new Euler(GALAXY_TILT[0], GALAXY_TILT[1], GALAXY_TILT[2]);
const _v = new Vector3();
const _tmp: [number, number, number] = [0, 0, 0];

/**
 * The Sun's LIVE world position — `SUNPOS` at fly angle 0, revolving about the
 * galactic centre in the tilted disc as it flies. Returns a SHARED array: read its
 * components immediately, don't retain it.
 */
export function flyingSunPos(): [number, number, number] {
  const a = galaxySpin.solar;
  // Sun's in-plane arm offset (SUN_ARM_RADIUS along local +X) revolved about the disc
  // normal (local +Y) by the fly angle, then rotated into world by the disc tilt.
  _v.set(SUN_ARM_RADIUS * Math.cos(a), 0, -SUN_ARM_RADIUS * Math.sin(a)).applyEuler(
    _tiltEuler
  );
  _tmp[0] = GALAXY_CENTER[0] + _v.x;
  _tmp[1] = GALAXY_CENTER[1] + _v.y;
  _tmp[2] = GALAXY_CENTER[2] + _v.z;
  return _tmp;
}
