import { create } from "zustand";
import { SOLAR, SUN, SUN_CORE } from "./config";

/**
 * Live-tuning plumbing for the Sun (used by the dev panel, `SunGui`).
 *
 * `SUN` / `SUN_CORE` / `SOLAR.ring` are mutated in place; most values are read every
 * frame. Values that shape the dots (counts, radii, grain, the core's colours, the
 * corona's share + reach) bump `version`, and the Sun rebuilds its dots when it changes.
 * The code defaults are snapshotted here for "reset".
 */
export const useSunTuning = create<{ version: number; rebuild: () => void }>((set) => ({
  version: 0,
  rebuild: () => set((s) => ({ version: s.version + 1 })),
}));

/** Ask the Sun to rebuild its dots (after a shape value changed). */
export function rebuildSun() {
  useSunTuning.getState().rebuild();
}

type Tunable = Record<string, unknown>;

// Snapshot of the code defaults, taken when this module loads (before any tuning).
const DEFAULTS = {
  sun: structuredClone(SUN) as Tunable,
  core: structuredClone(SUN_CORE) as Tunable,
  ring: structuredClone(SOLAR.ring) as Tunable,
};

/** Put every Sun tunable back to its value in the code. */
export function resetSunTuning() {
  Object.assign(SUN, DEFAULTS.sun);
  Object.assign(SUN_CORE, DEFAULTS.core);
  Object.assign(SOLAR.ring, DEFAULTS.ring);
  rebuildSun();
}

/** The current values as JSON — paste them back to bake them into `solar/config.ts`. */
export function sunTuningSnapshot(): string {
  return JSON.stringify({ SUN, SUN_CORE, "SOLAR.ring": SOLAR.ring }, null, 2);
}
