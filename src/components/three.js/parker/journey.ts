import { Vector3 } from "three";
import { orbitRadius } from "#/components/three.js/solar/config";
import { eclipticToDisplay } from "#/components/three.js/solar/orbits";
import { PARKER_ORBIT, parkerOffset, parkerRadius } from "./orbit";

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
  const v = new Vector3();
  const p = data.points;
  for (let i = 0; i < recorded; i++) {
    journeyPoint(p[i * 3], p[i * 3 + 1], p[i * 3 + 2], v);
    v.toArray(positions, i * 3);
    days[i] = data.days[i];
    if ((i + 1) % BUILD_STEP === 0) yield;
  }
  const endDay = data.endJD - data.launchJD;
  for (let k = 1; k <= live; k++) {
    const day = Math.min(endDay + k * LIVE_STEP_DAYS, nowJD - data.launchJD);
    parkerOffset(v, data.launchJD + day).toArray(positions, (recorded + k - 1) * 3);
    days[recorded + k - 1] = day;
    if (k % BUILD_STEP === 0) yield;
  }
  return { positions, days, count, today: days[count - 1] };
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
