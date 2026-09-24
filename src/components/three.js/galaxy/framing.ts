import { Euler, PerspectiveCamera, Quaternion, Vector3 } from "three";
import { GALAXY, GALAXY_SCALE, GALAXY_TILT, GALAXY_ZOOM } from "./config";
import { galaxyCenterPos, galaxyDrag } from "./spin";

/**
 * Framing the full galaxy on screen.
 *
 * The camera aims at the galaxy's CORE, but the disc is tilted toward us, so its near
 * half looks bigger and the whole spiral sits low on screen. `frameGalaxy` turns the
 * camera a little (it stays where it is, so the galaxy's pose is unchanged) so that,
 * in the FULL view, the disc's on-screen box is centred — by `GALAXY.frameCentering`
 * (0 = aim at the core, 1 = centre the whole disc). The turn is measured on the full
 * view (where the whole disc is in frame) and blended in by `weight` on the way there.
 * It follows the live disc, so the galaxy stays centred while a drag turns it.
 *
 * `galaxyFraming.correction` is the world rotation this added to the camera: the sky
 * (deep stars, distant galaxies, sparkles) is turned by it too, so only the galaxy
 * moves on screen — the sky keeps its designed layout (see `Galaxy.tsx`).
 */
export const galaxyFraming = { correction: new Quaternion() };

const RIM_POINTS = 48;
const END_DIR = new Vector3(...GALAXY_ZOOM.endDir).normalize();
const endView = new PerspectiveCamera();
const _tilt = new Quaternion();
const _disc = new Quaternion();
const _euler = new Euler();
const _p = new Vector3();
const _center = new Vector3();
const _aim = new Vector3();
const _before = new Quaternion();

/**
 * Re-aim `camera` (already placed + looking where the flight wants) to centre the galaxy.
 * `distanceScale`: the full view's distance factor (the drift back after landing).
 */
export function frameGalaxy(camera: PerspectiveCamera, weight: number, distanceScale = 1): void {
  galaxyFraming.correction.identity();
  const k = weight * GALAXY.frameCentering;
  if (k <= 0) return;

  // The full view: from `endDir` at `dEnd / endCloser`, looking at the (live) centre.
  const c = galaxyCenterPos();
  _center.set(c[0], c[1], c[2]);
  if (endView.fov !== camera.fov || endView.aspect !== camera.aspect) {
    endView.fov = camera.fov;
    endView.aspect = camera.aspect;
    endView.updateProjectionMatrix();
  }
  endView.position
    .copy(_center)
    .addScaledVector(END_DIR, (GALAXY_ZOOM.dEnd / GALAXY_ZOOM.endCloser) * distanceScale);
  endView.lookAt(_center);
  endView.updateMatrixWorld();

  // The disc rim's box on screen there (normalized device coords).
  _tilt.setFromEuler(_euler.set(GALAXY_TILT[0], GALAXY_TILT[1], GALAXY_TILT[2]));
  _disc.copy(galaxyDrag).multiply(_tilt);
  const R = GALAXY.discRadius * GALAXY_SCALE;
  let x0 = Infinity;
  let x1 = -Infinity;
  let y0 = Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < RIM_POINTS; i++) {
    const a = (i / RIM_POINTS) * Math.PI * 2;
    _p.set(R * Math.cos(a), 0, R * Math.sin(a)).applyQuaternion(_disc).add(_center).project(endView);
    x0 = Math.min(x0, _p.x);
    x1 = Math.max(x1, _p.x);
    y0 = Math.min(y0, _p.y);
    y1 = Math.max(y1, _p.y);
  }

  // The turn (camera-local): from straight ahead toward the box centre, by k — applied
  // to the live camera, keeping it upright.
  const tanH = Math.tan((camera.fov * Math.PI) / 360);
  _aim
    .set(((x0 + x1) / 2) * tanH * camera.aspect * k, ((y0 + y1) / 2) * tanH * k, -1)
    .normalize()
    .applyQuaternion(camera.quaternion)
    .add(camera.position);
  _before.copy(camera.quaternion);
  camera.lookAt(_aim);
  galaxyFraming.correction.copy(camera.quaternion).multiply(_before.invert());
}
