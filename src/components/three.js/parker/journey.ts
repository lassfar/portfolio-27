import { Vector3 } from "three";
import { orbitRadius } from "#/components/three.js/solar/config";
import { eclipticToDisplay } from "#/components/three.js/solar/orbits";
import { PARKER_ORBIT, parkerDistance, parkerOffset, parkerRadius } from "./orbit";

/**
 * Parker's journey from the Earth (P27-72): its real recorded path (public/data/
 * parker-journey.json, from NASA JPL Horizons) from the launch on 12 Aug 2018 — seven
 * Venus flybys each shrinking its loops — to today's orbit, mapped into the scene like
 * the planets so it lies on their orbit lines.
 */

/** The recorded path, as built by scripts/parker-journey.mjs. */
export type JourneyData = {
  launchJD: number;
  /** The last recorded day (PARKER_ORBIT's epoch); the live orbit takes over from here. */
  endJD: number;
  /** x, y, z (AU, heliocentric ecliptic J2000), flattened. */
  points: number[];
  /** Each point's day since the launch. */
  days: number[];
  /** The 7 Venus flybys: their day since the launch and where they were (AU). */
  flybys: { day: number; at: [number, number, number] }[];
  /** Each loop's closest pass to the Sun: its day since the launch and distance (AU, from the centre). */
  perihelia: { day: number; au: number }[];
};

/**
 * The journey's distance from the Sun in the scene: inside today's farthest point,
 * Parker's own eased map (`parkerRadius`, clear of the drawn Sun); beyond it, the
 * planets' compression — so the launch lands on the Earth's orbit and the flybys on
 * Venus's. Continuous at the joint (both give `orbitRadius(Q)` there).
 */
export function journeyRadius(au: number): number {
  return au <= PARKER_ORBIT.Q ? parkerRadius(au) : orbitRadius(au);
}

/** A real position (AU, ecliptic) → the scene, relative to the Sun. */
export function journeyPoint(x: number, y: number, z: number, out: Vector3): Vector3 {
  eclipticToDisplay(x, y, z, out);
  const r = Math.hypot(x, y, z);
  return r > 0 ? out.multiplyScalar(journeyRadius(r) / r) : out;
}

/** The line, ready to draw: positions (scene, relative to the Sun) and each point's day. */
export type JourneyLine = {
  positions: Float32Array;
  days: Float32Array;
  /** Each point's real distance from the Sun's centre (AU). */
  au: Float64Array;
  /** The closest it had come to the Sun by each point (AU), its perihelia included. */
  closest: Float64Array;
  perihelia: JourneyData["perihelia"];
  count: number;
  /** The day of the last point (today). */
  today: number;
};

/** Days between the live points after the recording ends (its fast perihelion arcs need ½). */
const LIVE_STEP_DAYS = 0.5;
/** Points converted per step of the build queue. */
const BUILD_STEP = 400;

/**
 * Build the line in steps (see sceneBuilds): the recorded path, then on from the live
 * orbit (`parkerOffset`) to `nowJD`, so it ends exactly at the probe.
 */
export function* buildJourney(data: JourneyData, nowJD: number): Generator<undefined, JourneyLine> {
  const recorded = data.days.length;
  const liveDays = Math.max(0, nowJD - data.endJD);
  const live = Math.ceil(liveDays / LIVE_STEP_DAYS);
  const count = recorded + live;
  const positions = new Float32Array(count * 3);
  const days = new Float32Array(count);
  const au = new Float64Array(count);
  const closest = new Float64Array(count);
  const v = new Vector3();
  const p = data.points;
  for (let i = 0; i < recorded; i++) {
    journeyPoint(p[i * 3], p[i * 3 + 1], p[i * 3 + 2], v);
    v.toArray(positions, i * 3);
    days[i] = data.days[i];
    au[i] = Math.hypot(p[i * 3], p[i * 3 + 1], p[i * 3 + 2]);
    if ((i + 1) % BUILD_STEP === 0) yield;
  }
  const endDay = data.endJD - data.launchJD;
  for (let k = 1; k <= live; k++) {
    const i = recorded + k - 1;
    const day = Math.min(endDay + k * LIVE_STEP_DAYS, nowJD - data.launchJD);
    parkerOffset(v, data.launchJD + day).toArray(positions, i * 3);
    days[i] = day;
    au[i] = parkerDistance(data.launchJD + day);
    if (k % BUILD_STEP === 0) yield;
  }
  // The closest yet, by each point: the points' own distances, and the perihelia passed
  // (they fall between the points).
  let record = Infinity;
  for (let i = 0, k = 0; i < count; i++) {
    for (; k < data.perihelia.length && data.perihelia[k].day <= days[i]; k++) {
      record = Math.min(record, data.perihelia[k].au);
    }
    record = Math.min(record, au[i]);
    closest[i] = record;
  }
  return { positions, days, au, closest, perihelia: data.perihelia, count, today: days[count - 1] };
}

/** How many points of the line are drawn once the journey has reached `day`. */
export function pointsUpTo(line: JourneyLine, day: number): number {
  let lo = 0;
  let hi = line.count;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (line.days[mid] <= day) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Where the journey is on `day` (scene, relative to the Sun), between its two recorded
 * points — the tip of the line as it draws, which the probe rides. Returns how many
 * whole points lie behind it (`pointsUpTo`).
 */
export function journeyTipAt(line: JourneyLine, day: number, out: Vector3): number {
  const n = Math.max(1, pointsUpTo(line, day));
  const p = line.positions;
  const a = (n - 1) * 3;
  if (n >= line.count) return out.set(p[a], p[a + 1], p[a + 2]), line.count;
  const t = (day - line.days[n - 1]) / (line.days[n] - line.days[n - 1] || 1);
  const b = n * 3;
  out.set(p[a] + (p[b] - p[a]) * t, p[a + 1] + (p[b + 1] - p[a + 1]) * t, p[a + 2] + (p[b + 2] - p[a + 2]) * t);
  return n;
}

/**
 * The closest the journey had come to the Sun by `day` (AU, from its centre): the
 * record before the tip, the tip itself as it dives in, and any perihelion it has just
 * passed — so it only ever shrinks, loop by loop.
 */
export function closestAt(line: JourneyLine, day: number): number {
  const n = Math.max(1, pointsUpTo(line, day));
  let c = line.closest[n - 1];
  if (n < line.count) {
    const t = (day - line.days[n - 1]) / (line.days[n] - line.days[n - 1] || 1);
    c = Math.min(c, line.au[n - 1] + (line.au[n] - line.au[n - 1]) * t);
  }
  for (const p of line.perihelia) {
    if (p.day > day) break;
    if (p.day > line.days[n - 1]) c = Math.min(c, p.au);
  }
  return c;
}

const AU_KM = 149_597_870.7;
const SUN_RADIUS_KM = 695_700;

/**
 * A distance from the Sun's centre (AU) as NASA quotes it — from the Sun's surface, in
 * millions of km, rounded down ("6.1", its record): whole millions from 100.
 */
export function millionKmFromSun(au: number): string {
  const m = (au * AU_KM - SUN_RADIUS_KM) / 1e6;
  return m >= 100 ? `${Math.floor(m)}` : (Math.floor(m * 10) / 10).toFixed(1);
}
