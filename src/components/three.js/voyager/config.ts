/**
 * The Lab · Voyager 1 — the story beat after the Earth arrival.
 *
 * Unlike every other body in the voyage (star, Saturn, sun, siblings, Earth),
 * which are living clouds of DOTS, Voyager is deliberately a SOLID, lit craft —
 * the one human-made object among the particle-formed worlds. The camera pulls
 * back from Earth and flies to it (see CameraRig segment 3 + LAB_CAM). The craft
 * turns WITH the cosmos — it mirrors the shared scene rotation (like the Saturn),
 * so dragging rotates the space and the craft as one. Its glowing Golden Record
 * opens the DOM experiments overlay (mirrors the Earth gallery).
 */

export const VOYAGER = {
  scale: 1.0,

  // Geometry (world units, before scale). Kept compact so the whole craft frames
  // cleanly at the LAB_CAM distance.
  dishRadius: 0.95,
  dishDepth: 0.36,
  rimTube: 0.03,
  busRadius: 0.34,
  busHeight: 0.34,
  record: { radius: 0.17, thickness: 0.03 },

  // A fixed yaw offset on top of the shared scene rotation — sets the craft's
  // baseline facing (the rest of its turning comes from useSceneRotation).
  initialYaw: 0.5,

  // Warm metallic palette (reads solid + man-made; the Record ties to the peach/gold brand).
  colors: {
    dish: "#F1E4D0",
    body: "#CEB79C",
    boom: "#B6A288",
    dark: "#8C7860",
    record: "#F2C24E",
    recordEmissive: "#6A4708",
  },
} as const;

/**
 * Voyager's fixed world position — the empty world ORIGIN, where the star first
 * burst and the Saturn assembled. By the Lab beat that spot is long empty, so it
 * reads as a clear place out from the system to arrive at (and quietly rhymes
 * with where the whole journey began). CHANGE to reposition the craft.
 */
export const VOYAGER_POS: [number, number, number] = [0, 0, 0];

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
 * Lab sub-phases, in `useLabScroll` progress (0..1 over the appended Lab scroll). You
 * leave the Earth and fly to the Parker Solar Probe (its camera timings live in
 * parker/config.ts PARKER_CAM).
 */
export const LAB = {
  earthFadeEnd: 0.16, // the Earth's pins, daylight and drag hand off as you leave it
  revealStart: 0.45, // (the retired Voyager's fade-in)
  revealEnd: 0.7,
  recordLabelAt: 0.9, // the memory-card label shows once you've arrived
} as const;
