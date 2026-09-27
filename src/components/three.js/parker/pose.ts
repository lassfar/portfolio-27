import { Matrix4, Quaternion, Vector3 } from "three";
import { PARKER, PARKER_CAM } from "./config";

type Vec3 = readonly [number, number, number];

const UP = new Vector3(0, 1, 0);
const _right = new Vector3();
const _x = new Vector3();
const _y = new Vector3();
const _z = new Vector3();
const _m = new Matrix4();

/**
 * The probe's frame at (ax, ay, az): +Y at the Sun (its heat shield always faces it),
 * X level (square to the Sun and the world's up), Z = X × Y. Shared scratch vectors —
 * use them before the next call.
 */
function frame(ax: number, ay: number, az: number, sun: Vec3) {
  _y.set(sun[0] - ax, sun[1] - ay, sun[2] - az).normalize();
  _x.crossVectors(UP, _y);
  if (_x.lengthSq() < 1e-10) _x.set(1, 0, 0);
  _x.normalize();
  _z.crossVectors(_x, _y).normalize();
  return { x: _x, y: _y, z: _z };
}

/** The probe's orientation: its model's +Y (the shield) toward the Sun. */
export function parkerQuaternion(out: Quaternion, ax: number, ay: number, az: number, sun: Vec3): Quaternion {
  const f = frame(ax, ay, az, sun);
  return out.setFromRotationMatrix(_m.makeBasis(f.x, f.y, f.z));
}

/** The direction from the probe to the Sun (unit). */
export function parkerSunDir(out: Vector3, ax: number, ay: number, az: number, sun: Vec3): Vector3 {
  return out.copy(frame(ax, ay, az, sun).y);
}

/**
 * The close-up camera's direction from the probe (unit, world): off the anti-Sun axis
 * by PARKER_CAM.side toward its front face (the high-gain antenna + the memory card),
 * a little above — so the Sun blazes behind the probe, off-centre, the 3/4 view.
 */
export function parkerCloseUpDir(out: Vector3, ax: number, ay: number, az: number, sun: Vec3): Vector3 {
  const f = frame(ax, ay, az, sun);
  const s = Math.sin(PARKER_CAM.side);
  const c = Math.cos(PARKER_CAM.side);
  return out
    .set(0, 0, 0)
    .addScaledVector(f.y, -c)
    .addScaledVector(f.x, s * Math.sin(PARKER.front))
    .addScaledVector(f.z, s * Math.cos(PARKER.front))
    .addScaledVector(UP, PARKER_CAM.lift)
    .normalize();
}

/**
 * The close-up's turn from a drag at the close-up (radians, damped by ParkerProbe, kept
 * after you let go — like the Saturn's): the camera circles the probe — `yaw` round
 * the world's up, `pitch` up / down (only if ROTATION.allowVerticalDrag).
 */
export const parkerOrbit = { yaw: 0, pitch: 0 };

/**
 * The close-up camera's direction from the probe, turned by the drag orbit
 * (parkerOrbit) — its elevation kept short of straight above / below.
 */
export function parkerViewDir(out: Vector3, ax: number, ay: number, az: number, sun: Vec3): Vector3 {
  parkerCloseUpDir(out, ax, ay, az, sun).applyAxisAngle(UP, parkerOrbit.yaw);
  const elev = Math.asin(Math.max(-1, Math.min(1, out.y)));
  const lifted = Math.max(-1.25, Math.min(1.25, elev + parkerOrbit.pitch));
  _right.crossVectors(UP, out);
  if (_right.lengthSq() < 1e-10) return out;
  return out.applyAxisAngle(_right.normalize(), -(lifted - elev)).normalize();
}
