#!/usr/bin/env node
/**
 * Builds public/data/parker-journey.json (P27-72): the Parker Solar Probe's real path
 * from its launch (12 Aug 2018) to the epoch of PARKER_ORBIT (20 Sep 2026), from NASA
 * JPL Horizons — heliocentric, ecliptic J2000, in AU — plus its 7 Venus flybys (each at
 * its closest approach to Venus) and each loop's closest pass to the Sun (its
 * perihelion, refined to the minute). After that epoch the scene continues the line
 * live from PARKER_ORBIT, so the two meet exactly.
 *
 * Run once (it needs the network): `node scripts/parker-journey.mjs`. The output is
 * committed; the site never calls Horizons.
 */
import { mkdir, writeFile } from "node:fs/promises";

const LAUNCH = "2018-08-12 07:31"; // UTC, Delta IV Heavy from Cape Canaveral
const LAUNCH_JD = 2458342.8132;
const START = "2018-08-12 12:00"; // Horizons' first state for the probe
const END = "2026-09-20 00:00"; // PARKER_ORBIT.epochJD (2461303.5)
const STEP = "6 h";
const OUT = new URL("../public/data/parker-journey.json", import.meta.url);

/** Heliocentric ecliptic J2000 positions (AU) of `body` over the range. */
async function vectors(body, start, stop, step) {
  const params = new URLSearchParams({
    format: "json",
    COMMAND: `'${body}'`,
    OBJ_DATA: "'NO'",
    MAKE_EPHEM: "'YES'",
    EPHEM_TYPE: "'VECTORS'",
    CENTER: "'500@10'",
    START_TIME: `'${start}'`,
    STOP_TIME: `'${stop}'`,
    STEP_SIZE: `'${step}'`,
    VEC_TABLE: "'1'",
    REF_PLANE: "'ECLIPTIC'",
    REF_SYSTEM: "'J2000'",
    OUT_UNITS: "'AU-D'",
    CSV_FORMAT: "'YES'",
  });
  const res = await fetch(`https://ssd.jpl.nasa.gov/api/horizons.api?${params}`);
  const { result } = await res.json();
  const body_ = result.slice(result.indexOf("$$SOE") + 5, result.indexOf("$$EOE"));
  return body_
    .trim()
    .split("\n")
    .map((line) => {
      const [jd, , x, y, z] = line.split(",").map((s) => s.trim());
      return { jd: Number(jd), x: Number(x), y: Number(y), z: Number(z) };
    });
}

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
const radius = (p) => Math.hypot(p.x, p.y, p.z);

/**
 * Ramer–Douglas–Peucker with a RELATIVE tolerance (a share of the distance from the
 * Sun), so the tight, fast arcs near perihelion keep their detail.
 */
function simplify(points, tolerance) {
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const A = points[a];
    const B = points[b];
    const ab = { x: B.x - A.x, y: B.y - A.y, z: B.z - A.z };
    const len2 = ab.x ** 2 + ab.y ** 2 + ab.z ** 2 || 1;
    let worst = 0;
    let at = -1;
    for (let i = a + 1; i < b; i++) {
      const P = points[i];
      const t = ((P.x - A.x) * ab.x + (P.y - A.y) * ab.y + (P.z - A.z) * ab.z) / len2;
      const c = { x: A.x + ab.x * t, y: A.y + ab.y * t, z: A.z + ab.z * t };
      const off = dist(P, c) / Math.max(Math.hypot(P.x, P.y, P.z), 0.02);
      if (off > worst) {
        worst = off;
        at = i;
      }
    }
    if (worst > tolerance) {
      keep[at] = 1;
      stack.push([a, at], [at, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

const parker = await vectors("-96", START, END, STEP);
const venus = await vectors("299", START, END, STEP);
const [earthAtLaunch] = await vectors("399", LAUNCH, "2018-08-12 08:31", "1 h");

// The flybys: the 7 deepest minima of the distance to Venus.
const gaps = parker.map((p, i) => dist(p, venus[i]));
const minima = [];
for (let i = 1; i < gaps.length - 1; i++) {
  if (gaps[i] < gaps[i - 1] && gaps[i] <= gaps[i + 1] && gaps[i] < 0.01) minima.push(i);
}
const flybys = minima.map((i) => parker[i]);

// Each loop's closest pass to the Sun: the 6-hour samples miss it by up to ~0.3 million
// km (it passes at ~190 km/s), so each is refined from minute-by-minute vectors.
const perihelia = [];
for (let i = 1; i < parker.length - 1; i++) {
  const r = radius(parker[i]);
  if (!(r < radius(parker[i - 1]) && r <= radius(parker[i + 1]))) continue;
  const fine = await vectors("-96", `JD${parker[i - 1].jd}`, `JD${parker[i + 1].jd}`, "1 m");
  perihelia.push(fine.reduce((best, p) => (radius(p) < radius(best) ? p : best)));
}

// The path starts at the Earth, at launch.
const launch = { jd: LAUNCH_JD, x: earthAtLaunch.x, y: earthAtLaunch.y, z: earthAtLaunch.z };
const path = [launch, ...parker];
const kept = simplify(path, 0.0025);

const round = (v, digits) => Number(v.toFixed(digits));
const data = {
  source: "NASA JPL Horizons — Parker Solar Probe (-96), heliocentric ecliptic J2000, AU",
  launchJD: LAUNCH_JD,
  endJD: parker[parker.length - 1].jd,
  // Flattened x, y, z (AU) and the day of each point since the launch.
  points: kept.flatMap((p) => [round(p.x, 4), round(p.y, 4), round(p.z, 4)]),
  days: kept.map((p) => round(p.jd - LAUNCH_JD, 2)),
  flybys: flybys.map((p) => ({
    day: round(p.jd - LAUNCH_JD, 2),
    at: [round(p.x, 4), round(p.y, 4), round(p.z, 4)],
  })),
  // Each loop's perihelion: its day since the launch and its distance from the Sun's centre (AU).
  perihelia: perihelia.map((p) => ({ day: round(p.jd - LAUNCH_JD, 3), au: round(radius(p), 6) })),
};

await mkdir(new URL("../public/data/", import.meta.url), { recursive: true });
await writeFile(OUT, JSON.stringify(data));
const date = (jd) => new Date((jd - 2440587.5) * 86400000).toISOString().slice(0, 10);
console.log(`points: ${kept.length} (from ${path.length}); flybys: ${flybys.length}`);
flybys.forEach((p, k) => console.log(`  Venus ${k + 1}: ${date(p.jd)}  (${(gaps[minima[k]] * 149597870.7).toFixed(0)} km)`));
console.log(`perihelia: ${perihelia.length}`);
perihelia.forEach((p, k) => console.log(`  ${k + 1}: ${date(p.jd)}  ${((radius(p) * 149597870.7 - 695700) / 1e6).toFixed(2)} million km from the surface`));
console.log(`wrote ${OUT.pathname} (${JSON.stringify(data).length} bytes)`);
