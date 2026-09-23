import { GALAXY, GALAXY_FX, GALAXY_SPACE, updateGalaxyPlacement } from "./config";

/**
 * Live-tuning plumbing for the galaxy (used by the dev panel, `GalaxyGui`).
 *
 * `GALAXY` / `GALAXY_FX` / `GALAXY_SPACE` are mutated in place; most values are read
 * every frame.
 * Values that shape the GEOMETRY bump `shapeVersion`, and the Galaxy rebuilds its
 * layers when it changes. The code defaults are snapshotted here for "reset".
 */
export const galaxyTuning = { shapeVersion: 0 };

/** Ask the Galaxy to rebuild its point layers (after a shape value changed). */
export function rebuildGalaxy() {
  galaxyTuning.shapeVersion++;
}

type Tunable = Record<string, unknown>;

// Snapshot of the code defaults, taken when this module loads (before any tuning).
const DEFAULTS = {
  galaxy: structuredClone(GALAXY) as Tunable,
  fx: structuredClone(GALAXY_FX) as Tunable,
  space: structuredClone(GALAXY_SPACE) as Tunable,
};

/** Copy `from` into `to` IN PLACE (keeps object/array identities other code holds). */
function assignDeep(to: Tunable, from: Tunable) {
  for (const key of Object.keys(from)) {
    const value = from[key];
    const current = to[key];
    if (Array.isArray(value) && Array.isArray(current)) {
      current.splice(0, current.length, ...value);
    } else if (value && typeof value === "object" && current && typeof current === "object") {
      assignDeep(current as Tunable, value as Tunable);
    } else {
      to[key] = value;
    }
  }
}

/** Put every tunable back to its value in the code. */
export function resetGalaxyTuning() {
  assignDeep(GALAXY as unknown as Tunable, DEFAULTS.galaxy);
  assignDeep(GALAXY_FX as unknown as Tunable, DEFAULTS.fx);
  assignDeep(GALAXY_SPACE as unknown as Tunable, DEFAULTS.space);
  updateGalaxyPlacement();
  rebuildGalaxy();
}

/** The current values as JSON — paste them back to bake them into `config.ts`. */
export function galaxyTuningSnapshot(): string {
  return JSON.stringify({ GALAXY, GALAXY_FX, GALAXY_SPACE }, null, 2);
}
