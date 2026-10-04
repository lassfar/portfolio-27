import { Vector3 } from "three";
import { orbitRadius, type OrbitElements } from "#/components/three.js/solar/config";
import { orbitPoint } from "#/components/three.js/solar/orbits";

/**
 * The Parker Solar Probe's REAL orbit — JPL Horizons osculating elements for Parker
 * (−96), heliocentric ecliptic J2000, at 2026-09-20 00:00 TDB. The orbit has been
 * stable since its 7th and last Venus flyby (Nov 2024): a long oval every ~88.4 days,
 * from 0.046 AU (≈6.9 million km from the Sun's centre) out to 0.73 AU (Venus's orbit).
 */
export const PARKER_ORBIT = {
  epochJD: 2461303.5, // 2026-09-20 00:00 TDB
  a: 0.388433, // semi-major axis (AU)
  e: 0.8820271,
  i: 3.3911342, // inclination (°)
  node: 76.483338, // longitude of the ascending node Ω (°)
  argPeri: 68.638866, // argument of perihelion ω (°)
  meanAnomaly: 62.668775, // M at the epoch (°)
  meanMotion: 4.0712705, // °/day
  q: 0.0458246, // perihelion (AU)
  Q: 0.7310413, // aphelion (AU)
  // The drawn Sun is ~5× bigger than the real one at the scene's scale (its glow
  // reaches ~4 units), so the closest pass (orbitRadius(q) ≈ 2.84) is eased out to
  // here: near the Sun it skims just outside the glow; the far half is unchanged.
  sunClear: 4.6,
} as const;

const DEG = Math.PI / 180;
const O = PARKER_ORBIT;
const ELEMENTS: OrbitElements = {
  au: O.a,
  e: O.e,
  i: O.i,
  node: O.node,
  peri: O.node + O.argPeri, // longitude of perihelion ϖ
  L0: 0, // (unused — the position runs from the epoch's mean anomaly)
  rate: 0,
};

/** Kepler's equation E − e·sin E = M for a very eccentric orbit (Newton, safe start). */
function eccentricAnomaly(M: number, e: number): number {
  const m = ((M % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  let E = m < Math.PI ? m + e / 2 : m - e / 2;
  for (let k = 0; k < 30; k++) {
    const step = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= step;
    if (Math.abs(step) < 1e-12) break;
  }
  return E;
}

/**
 * The probe's distance from the Sun in the scene, from its real distance (AU): the
 * planets' own compression (`orbitRadius`), point by point — so its far half lands
 * right at Venus's orbit, as it really does — eased at the near end to clear the
 * drawn Sun (`sunClear`).
 */
export function parkerRadius(au: number): number {
  const lo = orbitRadius(O.q);
  const hi = orbitRadius(O.Q);
  const t = (orbitRadius(au) - lo) / (hi - lo);
  return O.sunClear + t * (hi - O.sunClear);
}

/** Today's Julian date, from the real clock. */
export const julianNow = (): number => Date.now() / 86400000 + 2440587.5;

/** The probe's real distance from the Sun's centre (AU) at `jd`. */
export function parkerDistance(jd: number = julianNow()): number {
  const M = (O.meanAnomaly + O.meanMotion * (jd - O.epochJD)) * DEG;
  return O.a * (1 - O.e * Math.cos(eccentricAnomaly(M, O.e)));
}

/**
 * Where the probe is right now (display coordinates relative to the Sun, like
 * `orbitPositionAt` — turned by the same frame, so it lines up with the planets), at
 * its REAL speed: its true position at this moment, practically still over a visit.
 */
export function parkerOffset(out: Vector3, jd: number = julianNow()): Vector3 {
  const M = (O.meanAnomaly + O.meanMotion * (jd - O.epochJD)) * DEG;
  orbitPoint(ELEMENTS, O.a, eccentricAnomaly(M, O.e), out); // real position (AU)
  const r = out.length();
  return out.multiplyScalar(parkerRadius(r) / r);
}
