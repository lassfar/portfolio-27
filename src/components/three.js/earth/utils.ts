import { Vector3 } from "three";

/**
 * Geographic ↔ 3D helpers for the Earth globe. ONE convention is used by both
 * the dot-sampling (which reads the equirectangular mask) and the M3 photo-pins
 * (which place at real lat/lng), so pins land exactly on the continents:
 *
 *   • latitude  φ  = asin(y / r)                 (+90° = north pole = +y)
 *   • longitude λ  = atan2(-z, x)                (0° = +x, increases EAST)
 *   • equirect UV  : u = 0.5 + λ/2π ,  v = 0.5 − φ/π   (v=0 top = north)
 *
 * The mask is standard equirectangular (0° lon at image centre), so this matches
 * it directly.
 */

const DEG = Math.PI / 180;

/** Real (lat°, lng°) → a point on a sphere of radius `r`. Used by M3 pins. */
export function latLngToVector3(
  latDeg: number,
  lngDeg: number,
  r: number,
  target = new Vector3(),
): Vector3 {
  const phi = latDeg * DEG;
  const lambda = lngDeg * DEG;
  const cosPhi = Math.cos(phi);
  return target.set(
    r * cosPhi * Math.cos(lambda),
    r * Math.sin(phi),
    -r * cosPhi * Math.sin(lambda),
  );
}

/** A unit direction (x,y,z) → equirectangular UV in [0,1] for mask sampling. */
export function directionToUV(x: number, y: number, z: number): [number, number] {
  const phi = Math.asin(Math.max(-1, Math.min(1, y))); // clamp for safety
  const lambda = Math.atan2(-z, x);
  const u = 0.5 + lambda / (Math.PI * 2);
  const v = 0.5 - phi / Math.PI;
  return [u, v];
}

/** The globe's pitch limit (radians): how far a drag, or a turn to a place, tilts it. */
export const PITCH_LIMIT = 1.2;

/**
 * The globe's pitch and yaw (Euler XYZ: the pitch about x after the yaw about +y, as the globe
 * turns) that bring `pin`, a direction on the globe, to `toward`, a direction in the frame the
 * globe turns in: the place centred, facing the camera (P27-116). Of the two turns that do it,
 * the one with the globe least tilted; the pitch is kept within PITCH_LIMIT (a place too far
 * north or south for it ends as near the centre as that allows).
 */
export function faceAngles(pin: Vector3, toward: Vector3): { yaw: number; pitch: number } {
  const r = Math.hypot(pin.x, pin.z);
  const phi = Math.atan2(pin.z, pin.x);
  const spread = Math.acos(Math.max(-1, Math.min(1, r > 1e-9 ? toward.x / r : 0)));
  let best = { yaw: 0, pitch: 0 };
  for (const yaw of [phi + spread, phi - spread]) {
    // The pin after the yaw (its y and z: the pitch then turns them onto `toward`'s).
    const y = pin.y;
    const z = -pin.x * Math.sin(yaw) + pin.z * Math.cos(yaw);
    const pitch = nearestAngle(0, Math.atan2(toward.z, toward.y) - Math.atan2(z, y));
    if (yaw === phi + spread || Math.abs(pitch) < Math.abs(best.pitch)) best = { yaw, pitch };
  }
  return { yaw: best.yaw, pitch: Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, best.pitch)) };
}

/** `to` (radians), moved by whole turns to within half a turn of `from`: the short way round. */
export function nearestAngle(from: number, to: number): number {
  const d = to - from;
  return from + d - 2 * Math.PI * Math.round(d / (2 * Math.PI));
}
