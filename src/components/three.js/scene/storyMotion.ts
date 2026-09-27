import { easeInOutCubic } from "#/components/three.js/star/utils";

/** The in-out curves the story's standard moves can use (all start and end at rest). */
export type StoryCurve = "cubic" | "power2" | "sine" | "smoothstep";

/**
 * The story's motion language (P27-77): the ONE curve its standard moves follow —
 * Saturn assembling, the fly-out, the Earth dive, the Lab's pull-back, the finale's
 * pull-out, the galaxy drift.
 * Cinematic cubic by default: slow → fast (peak 3× the average pace) → slow.
 * Mutable (the dev panel's "Story motion" switches it live).
 *
 * Kept on their own purpose-built curves: the star's burst (ease-in), the Lab's zoom to
 * the probe (its fast empty stretch), the flight out to the Milky Way (GALAXY_FLIGHT,
 * below) and the text overlays' quick ease-out.
 */
export const STORY_MOTION: { curve: StoryCurve } = { curve: "cubic" };

/** The story's standard in-out curve (STORY_MOTION.curve), t in 0..1. */
export function storyEase(t: number): number {
  switch (STORY_MOTION.curve) {
    case "power2":
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // peak 2×
    case "sine":
      return 0.5 - 0.5 * Math.cos(Math.PI * t); // peak ≈1.57×
    case "smoothstep":
      return t * t * (3 - 2 * t); // peak 1.5×
    default:
      return easeInOutCubic(t); // peak 3×
  }
}

/**
 * The flight out to the Milky Way (The Way Out → The Milky Way): an exception to the
 * standard curve — slow → normal → VERY slow, a long, lingering landing on the full
 * galaxy. A Kumaraswamy curve, 1 − (1 − t^rise)^settle: `rise` > 1 eases the start,
 * `settle` > 1 stretches the slow finish (2 / 5.1: 0 → 0.98× at 10% → ~2× through the
 * middle → 0.26× at 75% → 0.01× at 90% → 0 — the landing twice as slow as 2 / 4). Mutable (the dev panel's "Story motion").
 */
export const GALAXY_FLIGHT = { rise: 2, settle: 5.1 };

/** The flight out to the Milky Way's curve (GALAXY_FLIGHT), t in 0..1. */
export function galaxyFlightEase(t: number): number {
  return (
    1 - Math.pow(1 - Math.pow(t, GALAXY_FLIGHT.rise), GALAXY_FLIGHT.settle)
  );
}
