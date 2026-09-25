import { Vector3 } from "three";
import {
  keplerRate,
  MoonDef,
  orbitRadius,
  OrbitElements,
  SATURN_ELEMENTS,
  SATURN_ORBIT_PHASE0,
  SOLAR_MOTION,
} from "./config";

/**
 * The real solar system's maths (the data lives in config.ts): where each body is on
 * its real orbit, starting from where it really is today.
 *
 *   • Positions come from each orbit's real (J2000) elements through Kepler's
 *     equation, so the ovals, tilts and orientations are real and the planets speed
 *     up near the Sun. Distances are compressed (`orbitRadius`) and the motion is
 *     paced (`keplerRate`).
 *   • "Today" is the page's load time. The whole system is turned about the pole so
 *     the Saturn's real position today lands on its fixed spot (the world origin), so
 *     every other body sits where it really is relative to it.
 *   • The system's clock (`systemTime`) is 0 until the voyage begins, like the
 *     Saturn's, so the system first appears in today's real configuration, then
 *     moves on.
 *
 * Display coordinates (relative to the Sun): the ecliptic is the XZ plane, +Y is
 * north, and a body at longitude λ sits along (cos λ, 0, −sin λ) — counterclockwise
 * seen from the north, like the real orbits (and the planets' spins).
 */

const DEG = Math.PI / 180;

/** Today's Julian date (the page's load time). */
const JD = Date.now() / 86400000 + 2440587.5;
/** Julian centuries since J2000. */
const T = (JD - 2451545.0) / 36525;

/** Solve Kepler's equation E − e·sin E = M for the eccentric anomaly E (radians). */
function eccentricAnomaly(M: number, e: number): number {
  let E = M + e * Math.sin(M);
  for (let k = 0; k < 6; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  return E;
}

/** An orbit's real mean anomaly today (radians). */
function meanAnomalyToday(el: OrbitElements): number {
  return (el.L0 + el.rate * T - el.peri) * DEG;
}

/** A body's real heliocentric longitude today (radians, along its orbit ≈ the ecliptic). */
function longitudeToday(el: OrbitElements): number {
  const E = eccentricAnomaly(meanAnomalyToday(el), el.e);
  const nu = 2 * Math.atan2(Math.sqrt(1 + el.e) * Math.sin(E / 2), Math.sqrt(1 - el.e) * Math.cos(E / 2));
  return nu + el.peri * DEG;
}

/**
 * The turn about the pole that puts the Saturn's real position today on its fixed
 * spot (the display angle −SATURN_ORBIT_PHASE0 — see `orbitPosition` in config.ts).
 */
const FRAME = -SATURN_ORBIT_PHASE0 - longitudeToday(SATURN_ELEMENTS);

let startedAt = 0;

/**
 * Seconds the system has been in motion: held at 0 until the voyage begins (and reset
 * there, like the Saturn's clock), so the system first appears in today's real
 * configuration. Call it each frame with R3F's clock — every caller in a frame gets
 * the same value.
 */
export function systemTime(elapsed: number, voyage: number): number {
  if (voyage <= 0.001) startedAt = elapsed;
  return elapsed - startedAt;
}

/** A point of an orbit (at eccentric anomaly E), in display coordinates. */
function orbitPoint(el: OrbitElements, a: number, E: number, out: Vector3): Vector3 {
  const xp = a * (Math.cos(E) - el.e);
  const yp = a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
  const w = (el.peri - el.node) * DEG; // argument of perihelion
  const node = el.node * DEG + FRAME;
  const i = el.i * DEG;
  const cw = Math.cos(w);
  const sw = Math.sin(w);
  const cn = Math.cos(node);
  const sn = Math.sin(node);
  const ci = Math.cos(i);
  const si = Math.sin(i);
  // Orbit plane → ecliptic (X toward the turned equinox, Y 90° ahead, Z north) → display.
  const X = (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp;
  const Y = (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp;
  const Z = sw * si * xp + cw * si * yp;
  return out.set(X, Z, -Y);
}

/** A body's position (display, relative to the Sun) `t` seconds into the system's motion. */
export function orbitPositionAt(el: OrbitElements, t: number, out: Vector3): Vector3 {
  const a = orbitRadius(el.au);
  const M = meanAnomalyToday(el) + keplerRate(a) * t;
  return orbitPoint(el, a, eccentricAnomaly(M, el.e), out);
}

/** An orbit's outline (for its orbit line): `segments` points around the real oval. */
export function orbitOutline(el: OrbitElements, segments: number): Float32Array {
  const a = orbitRadius(el.au);
  const out = new Float32Array(segments * 3);
  const v = new Vector3();
  for (let k = 0; k < segments; k++) {
    orbitPoint(el, a, (k / segments) * Math.PI * 2, v);
    out[k * 3] = v.x;
    out[k * 3 + 1] = v.y;
    out[k * 3 + 2] = v.z;
  }
  return out;
}

/** A flat circle's outline (the Saturn's fixed orbit through the origin). */
export function circleOutline(r: number, segments: number): Float32Array {
  const out = new Float32Array(segments * 3);
  for (let k = 0; k < segments; k++) {
    const phi = (k / segments) * Math.PI * 2;
    out[k * 3] = r * Math.cos(phi);
    out[k * 3 + 2] = r * Math.sin(phi);
  }
  return out;
}

/**
 * The Saturn's orbital angle (for `orbitPosition`) `t` seconds in: from its spot at
 * the origin, counterclockwise, at its Kepler pace.
 */
export function saturnAngle(radius: number, t: number): number {
  return SATURN_ORBIT_PHASE0 - keplerRate(radius) * t;
}

/** A moon's mean motion (rad/s) on its system's pace — also its (tidally locked) spin. */
export function moonRate(m: MoonDef): number {
  const secondsPerDay =
    m.parent === "earth" ? SOLAR_MOTION.moonSecondsPerDay : SOLAR_MOTION.jupiterMoonSecondsPerDay;
  return (2 * Math.PI) / (m.period * secondsPerDay);
}

/** A moon's longitude (display angle) `t` seconds in — from today's real position. */
export function moonLongitudeAt(m: MoonDef, t: number): number {
  return (m.L0 + m.rate * (JD - m.epoch)) * DEG + FRAME + moonRate(m) * t;
}

/** A moon's position around its planet (display, relative to the planet) `t` seconds in. */
export function moonPositionAt(m: MoonDef, t: number, out: Vector3): Vector3 {
  const node = (m.node + m.nodeRate * (JD - m.epoch)) * DEG + FRAME;
  const u = moonLongitudeAt(m, t) - node; // along the orbit from the ascending node
  const i = m.incl * DEG;
  const cn = Math.cos(node);
  const sn = Math.sin(node);
  const X = m.distance * (cn * Math.cos(u) - sn * Math.sin(u) * Math.cos(i));
  const Y = m.distance * (sn * Math.cos(u) + cn * Math.sin(u) * Math.cos(i));
  const Z = m.distance * Math.sin(u) * Math.sin(i);
  return out.set(X, Z, -Y);
}
