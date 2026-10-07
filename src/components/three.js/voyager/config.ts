import { labAt } from "#/components/three.js/star/config";

/**
 * The Lab, the story beat after the Earth: its camera arrival (LAB_CAM) and its
 * sub-phases (LAB). (Its first craft, a solid Voyager 1, was retired for the Parker
 * Solar Probe's memory card: parker/.)
 */

/**
 * Arrival camera for the Lab (mirrors EARTH_CAM): sits back from the Voyager,
 * looking at it, so the craft frames by perspective. Tune distance/angle here.
 */
export const LAB_CAM = {
  // The single, readable arrival pose — a 3/4 view so the dish reads concave and
  // the bus + booms show depth. The camera does one decelerating fly straight to
  // here (no tiny-speck-then-zoom stage), so Voyager is directly readable at the
  // end of the trip.
  offset: [2.6, 1.2, 3.8] as [number, number, number],
  look: [0, -0.4, 0] as [number, number, number], // aim a touch low — the craft's mass hangs below the dish
} as const;

/**
 * Lab sub-phases, in `useLabScroll` progress (0..1 over the appended Lab scroll), set
 * from scroll % into the Lab (labAt) so the trip keeps its length whatever the
 * close-up's pause. You leave the Earth and fly to the Parker Solar Probe (its camera
 * timings live in parker/config.ts PARKER_CAM).
 */
export const LAB = {
  earthFadeEnd: labAt(224), // the Earth's pins, daylight and drag hand off as you leave it
  revealStart: labAt(630), // (the retired Voyager's fade-in)
  revealEnd: labAt(980),
  recordLabelAt: labAt(1260), // you've arrived: the close-up (its drag orbit, the assistant's rest window)
} as const;
