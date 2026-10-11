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

/**
 * The globe's yaw (its turn about +y) that brings `pin`, a direction in the globe before its
 * yaw, closest to `toward`, in the same frame. Turns a place to face the camera (P27-99).
 */
export const yawToFace = (pin: Vector3, toward: Vector3): number =>
  Math.atan2(toward.x * pin.z - toward.z * pin.x, toward.x * pin.x + toward.z * pin.z);

/** `to` (radians), moved by whole turns to within half a turn of `from`: the short way round. */
export function nearestAngle(from: number, to: number): number {
  const d = to - from;
  return from + d - 2 * Math.PI * Math.round(d / (2 * Math.PI));
}
