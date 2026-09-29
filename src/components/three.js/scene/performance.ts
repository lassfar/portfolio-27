/**
 * The Performance switches (P27-78): each performance fix can be flipped live in the dev
 * panel (`?gui`, "⚡ Performance") to compare the look before it with the look after.
 * Mutable: the panel edits it in place and the scene reads it live (like STORY_MOTION);
 * `onPerformanceChange` tells the few places that apply a switch once, not every frame.
 *
 * Visitors always get these defaults: saved switches only load with `?gui`
 * (PerformanceGui), and only in the browser that saved them.
 */

/** Multisampling (edge smoothing) of the composer's scene buffer; 0 = off. */
export type Msaa = 0 | 2 | 4 | 8;

export type PerformanceSettings = {
  msaa: Msaa;
  pauseCovered: boolean;
};

export const PERFORMANCE: PerformanceSettings = {
  msaa: 4, // was 8 (the library default); soft dots smooth their own edges
  pauseCovered: true, // skip drawing under the opaque Craft overlay and the Lightbox
};

/** The code defaults, for "restore defaults". */
export const PERFORMANCE_DEFAULTS: Readonly<PerformanceSettings> = { ...PERFORMANCE };

/** The values each switch accepts; anything else found in storage is ignored. */
const CHOICES: { [K in keyof PerformanceSettings]: readonly PerformanceSettings[K][] } = {
  msaa: [0, 2, 4, 8],
  pauseCovered: [true, false],
};

const STORAGE_KEY = "p27.performance";

const listeners = new Set<() => void>();

/** Call `fn` whenever a switch changes. Returns the unsubscribe (for a useEffect). */
export function onPerformanceChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function notifyPerformance(): void {
  listeners.forEach((fn) => fn());
}

/** Apply the switches saved in this browser (only the known keys and values). */
export function loadSavedPerformance(): void {
  try {
    const saved: Record<string, unknown> = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    const settings = PERFORMANCE as Record<string, unknown>;
    for (const [key, choices] of Object.entries(CHOICES)) {
      if ((choices as readonly unknown[]).includes(saved[key])) settings[key] = saved[key];
    }
  } catch {
    // Storage blocked or unreadable: keep the defaults.
  }
  notifyPerformance();
}

export function savePerformance(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(PERFORMANCE));
  } catch {
    // Storage blocked (private mode…): the switches still apply until reload.
  }
}

export function restorePerformanceDefaults(): void {
  Object.assign(PERFORMANCE, PERFORMANCE_DEFAULTS);
  savePerformance();
  notifyPerformance();
}
