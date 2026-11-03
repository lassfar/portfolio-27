/**
 * What the loading screen waits for (P27-115), and how much of the bar each is worth: they
 * finish in any order (the fonts and the code load side by side), so the bar is the sum of the
 * ones done, 1 once all are.
 */
export const LOAD_STEPS = {
  /** The page's fonts. */
  fonts: 0.15,
  /** The journey's motion code (loadJourneyMotion). */
  journey: 0.25,
  /** The 3D scene's code (preloadScene). */
  scene: 0.2,
  /** The journey in place: its smooth scroll and pin (waitForJourney). */
  placed: 0.2,
  /** The 3D's first frames drawn. */
  drawn: 0.2,
} as const;

export type LoadStep = keyof typeof LOAD_STEPS;

/** The bar (0–1) once `done` have finished. */
export function loadProgress(done: Iterable<LoadStep>): number {
  let sum = 0;
  for (const step of new Set(done)) sum += LOAD_STEPS[step];
  return Math.min(1, Math.round(sum * 1000) / 1000);
}

/** The bar as a progress bar says it: a whole percentage. */
export const loadPercent = (progress: number): number => Math.round(progress * 100);
