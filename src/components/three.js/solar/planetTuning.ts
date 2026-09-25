import { Object3D } from "three";
import { create } from "zustand";
import { ASTEROIDS, MOONS, PLANET_LOD, PLANET_STYLE, PLANETS, SATURN_LOOK, SOLAR_MOTION } from "./config";

/**
 * Live-tuning plumbing for the planets, moons and asteroid belt (used by the dev
 * panel, `PlanetGui`).
 *
 * `PLANETS`, `MOONS`, `PLANET_STYLE`, `ASTEROIDS` and `SOLAR_MOTION` are mutated in
 * place and read every frame; values that shape the dots or the orbits (sizes,
 * counts, grain, distances) bump `version`, and the bodies, belt and orbit lines
 * rebuild when it changes. The code defaults are snapshotted here for "reset".
 */
export const usePlanetTuning = create<{ version: number; rebuild: () => void }>((set) => ({
  version: 0,
  rebuild: () => set((s) => ({ version: s.version + 1 })),
}));

/** Ask the planets to rebuild their dots (after a shape value changed). */
export function rebuildPlanets() {
  usePlanetTuning.getState().rebuild();
}

/**
 * The dev "inspect" camera: the planet or moon to fly close to (null = off), how far
 * from it (× its radius) and the angle between the view and the Sun (0° = the full day
 * side, 90° = half lit, 150° = a crescent). Each body registers its object + radius
 * here; the camera reads its world position at frame time (after the orbits have
 * moved — they update first, at useFrame priority ORBIT_PRIORITY), so even fast moons
 * stay centred.
 */
export const planetInspect = {
  id: null as string | null,
  distance: 4,
  sunAngle: 40,
  bodies: {} as Record<string, { object: Object3D; size: number }>,
};

/** useFrame priority of everything that moves the bodies: before the rest (the camera). */
export const ORBIT_PRIORITY = -1;

// Snapshot of the code defaults, taken when this module loads (before any tuning).
const DEFAULTS = structuredClone({
  style: PLANET_STYLE,
  lod: PLANET_LOD,
  saturn: SATURN_LOOK,
  planets: PLANETS,
  moons: MOONS,
  asteroids: ASTEROIDS,
  motion: SOLAR_MOTION,
});

/** Copy `source` onto `target` in place, nested objects included (the panel keeps references to them). */
function assignDeep(target: Record<string, unknown>, source: Record<string, unknown>) {
  for (const [key, value] of Object.entries(source)) {
    const current = target[key];
    if (value && typeof value === "object" && current && typeof current === "object") {
      assignDeep(current as Record<string, unknown>, value as Record<string, unknown>);
    } else {
      target[key] = value;
    }
  }
}

/** Put every planet tunable back to its value in the code. */
export function resetPlanetTuning() {
  assignDeep(PLANET_STYLE, DEFAULTS.style);
  assignDeep(PLANET_LOD, DEFAULTS.lod);
  assignDeep(SATURN_LOOK, DEFAULTS.saturn);
  PLANETS.forEach((planet, i) => assignDeep(planet, DEFAULTS.planets[i]));
  MOONS.forEach((moon, i) => assignDeep(moon, DEFAULTS.moons[i]));
  assignDeep(ASTEROIDS, DEFAULTS.asteroids);
  assignDeep(SOLAR_MOTION, DEFAULTS.motion);
  rebuildPlanets();
}

/** The current values as JSON — paste them back to bake them into `solar/config.ts`. */
export function planetTuningSnapshot(): string {
  return JSON.stringify({ SOLAR_MOTION, PLANET_STYLE, PLANET_LOD, SATURN_LOOK, PLANETS, MOONS, ASTEROIDS }, null, 2);
}
