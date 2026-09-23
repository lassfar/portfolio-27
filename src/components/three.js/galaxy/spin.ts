import { Euler, Quaternion, Vector3 } from "three";
import { clamp01 } from "#/components/three.js/star/utils";
import { SUNPOS } from "#/components/three.js/solar/config";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useSceneRotation } from "#/stores/useSceneRotation";
import {
  GALAXY,
  GALAXY_CENTER,
  GALAXY_PLACEMENT,
  GALAXY_SPACE,
  GALAXY_TILT,
} from "./config";

/**
 * The solar system "flying" through the galaxy at the finale.
 *
 * The whole real solar system revolves about the galactic centre at the galaxy's own
 * spin rate — drifting through its arm, alive, instead of sitting frozen. The revolve
 * happens in the tilted disc plane (about the disc normal), and PERSISTS the whole
 * time the finale is on-screen: the camera is anchored on the live Sun position, so
 * scrolling back zooms into the solar system wherever it has flown to. It only moves
 * while the system is on screen (from `GALAXY.flyFrom`), and resets once we're right
 * back at the Voyager (below `GALAXY.flyResetBelow`), giving each fresh entry a clean
 * start at `SUNPOS`. The Voyager and the camera's opening framing fly with the system
 * (`flyOffset`), so that reset is invisible.
 */

/** Live fly angle (rad) about the disc normal. Advanced by the Galaxy each frame. */
export const galaxySpin = { solar: 0 };

/** Advance (or reset) the solar fly angle. Called once per frame by the Galaxy. */
export function advanceSolarFly(delta: number, animate: boolean): void {
  const g = clamp01(useGalaxyScroll.getState().progress);
  if (g < GALAXY.flyResetBelow) {
    galaxySpin.solar = 0; // back at the Voyager: reset (the view moves with it — see flyOffset)
    return;
  }
  if (g < GALAXY.flyFrom) return; // the system is still hidden: hold it where it is
  if (animate && !GALAXY.paused) galaxySpin.solar += GALAXY.spinSpeed * delta;
}

const _tiltEuler = new Euler();
const _v = new Vector3();
const _tmp: [number, number, number] = [0, 0, 0];

/**
 * The Sun's LIVE world position — `SUNPOS` at fly angle 0, revolving about the
 * galactic centre in the tilted disc as it flies. Returns a SHARED array: read its
 * components immediately, don't retain it.
 */
export function flyingSunPos(): [number, number, number] {
  const a = galaxySpin.solar;
  const R = GALAXY_PLACEMENT.sunArmRadius;
  // Sun's in-plane arm offset (R along local +X) revolved about the disc normal (local
  // +Y) by the fly angle, then rotated into world by the (live) disc tilt.
  _v.set(R * Math.cos(a), 0, -R * Math.sin(a)).applyEuler(
    _tiltEuler.set(GALAXY_TILT[0], GALAXY_TILT[1], GALAXY_TILT[2])
  );
  _tmp[0] = GALAXY_CENTER[0] + _v.x;
  _tmp[1] = GALAXY_CENTER[1] + _v.y;
  _tmp[2] = GALAXY_CENTER[2] + _v.z;
  return _tmp;
}

const _offset: [number, number, number] = [0, 0, 0];

/**
 * How far the solar system has flown from home (`flyingSunPos() − SUNPOS`). The
 * Voyager (+ the Pale Blue Dot) travel WITH the system, and so does the camera's
 * Voyager framing at the start of the finale — so on scroll-back the opening beat
 * still frames the Voyager and the whole solar system, wherever they've flown, and
 * the reset (back at the Voyager) moves the camera and everything in view together:
 * invisible. Zero whenever the Lab is on screen. Returns a SHARED array.
 */
export function flyOffset(): [number, number, number] {
  const sun = flyingSunPos();
  _offset[0] = sun[0] - SUNPOS[0];
  _offset[1] = sun[1] - SUNPOS[1];
  _offset[2] = sun[2] - SUNPOS[2];
  return _offset;
}

// ── Drag: the galaxy turns WITH the rest of space ─────────────────────────────
//
// A drag already turns the whole cosmos (`useSceneRotation`: the starfield, the
// planets around the Sun, the Voyager). The galaxy — and the space around it (deep
// stars, distant galaxies, sparkles) — joins in: it turns by the SAME rotation,
// about the Sun, so the solar system stays exactly where it is in its arm.
//
// Only the turn made since the galaxy's space came on screen counts: while none of
// it is visible, the reference follows the scene rotation (no turn) — so it always
// first appears in its designed pose, whatever was dragged earlier in the journey.

/** The galaxy space's live drag turn (identity = the designed pose). */
export const galaxyDrag = new Quaternion();

const _dragBase = new Quaternion();
const _dragNow = new Quaternion();
const _dragInv = new Quaternion();
const _dragEuler = new Euler();

/** The galaxy progress at which its space first shows (galaxy or deep stars). */
export function galaxySpaceAppearsAt(): number {
  return Math.min(GALAXY.revealStart, GALAXY_SPACE.starsIn[0]);
}

/** Update `galaxyDrag` from the shared scene rotation. Called once per frame by the Galaxy. */
export function updateGalaxyDrag(): void {
  const g = clamp01(useGalaxyScroll.getState().progress);
  const r = useSceneRotation.getState();
  _dragNow.setFromEuler(_dragEuler.set(r.pitch, r.yaw, 0)); // same order as the starfield
  if (g < galaxySpaceAppearsAt() || !GALAXY_SPACE.dragTurns) _dragBase.copy(_dragNow);
  galaxyDrag.copy(_dragNow).multiply(_dragInv.copy(_dragBase).invert());
}

const _c = new Vector3();
const _center: [number, number, number] = [0, 0, 0];

/**
 * The galaxy centre's LIVE world position: `GALAXY_CENTER`, turned by the drag about
 * the (flying) Sun. Returns a SHARED array: read its components immediately.
 */
export function galaxyCenterPos(): [number, number, number] {
  const sun = flyingSunPos();
  const sx = sun[0];
  const sy = sun[1];
  const sz = sun[2];
  _c.set(GALAXY_CENTER[0] - sx, GALAXY_CENTER[1] - sy, GALAXY_CENTER[2] - sz).applyQuaternion(
    galaxyDrag
  );
  _center[0] = sx + _c.x;
  _center[1] = sy + _c.y;
  _center[2] = sz + _c.z;
  return _center;
}
