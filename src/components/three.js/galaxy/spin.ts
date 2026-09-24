import { Euler, Quaternion, Vector3 } from "three";
import { clamp01, remap01 } from "#/components/three.js/star/utils";
import { SUNPOS } from "#/components/three.js/solar/config";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useSceneRotation } from "#/stores/useSceneRotation";
import {
  GALAXY,
  GALAXY_CENTER,
  GALAXY_PLACEMENT,
  GALAXY_SPACE,
  GALAXY_TILT,
  GALAXY_ZOOM,
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
// stars, distant galaxies, sparkles) — joins in: each frame's drag turns it by the
// SAME rotation, about the Sun, so the solar system stays exactly where it is in its
// arm. (While none of the galaxy's space is on screen, nothing is kept.)
//
// …but the FULL VIEW always lands in the designed pose, however much was dragged on
// the way (e.g. turning the solar system): scrolling on toward the full view unwinds
// the kept turn — the short way, so any amount of dragging costs at most a half-turn
// — on the same curve as the reveal orbit (one move), reaching zero exactly at the
// full view. A drag AT the full view turns the galaxy freely; scrolling back keeps
// that pose (no jump); scrolling forward again unwinds it. Nothing ever jumps: the
// kept turn only changes by the drag itself or by scrolling forward.
//
// The REVEAL ORBIT rides on the same turn: as the galaxy is revealed, its space turns
// by `GALAXY.revealOrbit` → 0 (with the galaxy's spin — so the view reads as circling
// around it against the spin), settling into the designed pose at the full view. It's
// driven by the ZOOM-OUT's own progress (the camera distance grows exponentially with
// it), so the turn and the pull-back are one move — starting from rest after the
// solar-system hold and gliding to rest together — weighted toward the end
// (`revealOrbitLate`). It only starts moving as the galaxy starts to appear.

/** The galaxy space's live turn — the drag + the reveal orbit (identity = the designed pose). */
export const galaxyDrag = new Quaternion();

const _dragKept = new Quaternion(); // the user's (unwinding) turn of the galaxy space
const _dragNow = new Quaternion();
const _dragPrev = new Quaternion();
const _dragStep = new Quaternion();
const _dragEuler = new Euler();
const _identity = new Quaternion();
const _orbit = new Quaternion();
const _up = new Vector3(0, 1, 0);
let _hasPrev = false;
let _prevE = 0;

/** The galaxy progress at which its space first shows (galaxy or deep stars). */
export function galaxySpaceAppearsAt(): number {
  return Math.min(GALAXY.revealStart, GALAXY_SPACE.starsIn[0]);
}

/**
 * How much of the reveal's turn is still to come at zoom-out progress `e` (1 → 0):
 * the curve the reveal orbit AND the drag unwinding follow, so they move as one.
 */
function revealTurnLeft(e: number): number {
  return 1 - Math.pow(e, Math.max(1, GALAXY.revealOrbitLate));
}

/** Update `galaxyDrag` from the shared scene rotation. Called once per frame by the Galaxy. */
export function updateGalaxyDrag(): void {
  const g = clamp01(useGalaxyScroll.getState().progress);
  const e = remap01(g, GALAXY_ZOOM.panSunEnd, 1); // the zoom-out's progress (leg 2)
  const r = useSceneRotation.getState();
  _dragNow.setFromEuler(_dragEuler.set(r.pitch, r.yaw, 0)); // same order as the starfield

  if (g < galaxySpaceAppearsAt() || !GALAXY_SPACE.dragTurns) {
    _dragKept.identity(); // nothing of the galaxy on screen: keep no turn
  } else if (_hasPrev) {
    // This frame's drag turns the galaxy space too (world-space step)…
    _dragKept.premultiply(_dragStep.copy(_dragNow).multiply(_dragPrev.invert()));
    // …and scrolling on toward the full view unwinds what's kept, on the reveal's
    // curve: what's left shrinks with the turn still to come → exactly 0 at the end.
    const before = revealTurnLeft(_prevE);
    const after = revealTurnLeft(e);
    if (after < before && before > 0) _dragKept.slerp(_identity, 1 - after / before);
  }
  _dragPrev.copy(_dragNow);
  _prevE = e;
  _hasPrev = true;

  // The reveal orbit, on the same curve.
  const degrees = GALAXY.revealOrbit * revealTurnLeft(e);
  galaxyDrag.setFromAxisAngle(_up, -(degrees * Math.PI) / 180).multiply(_dragKept);
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
