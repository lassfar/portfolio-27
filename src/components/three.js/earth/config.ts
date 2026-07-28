/**
 * The interactive Earth globe — the destination of the photography voyage (M2).
 *
 * Earth stays in the voyage's living-DOTS language (like the star, Saturn, sun
 * and sibling planets): a dense sphere of dots whose colour is sampled per-dot
 * from a real equirectangular land/ocean map, so the continents read clearly
 * (land = warm/bright, ocean = dim blue).
 *
 * Earth is a NORMAL orbiting member of the solar system on its own place (see
 * EARTH_ORBIT) — it never grows or transitions. The CAMERA flies to it and
 * tracks its orbit (like the Saturn), so it fills the view purely by perspective
 * while the rest of the system fades. You can drag-rotate it, and it resumes a
 * gentle idle self-spin when released — a real planet's day. Real city photo-pins
 * land on it in M3 (see `data.ts` + `latLngToVector3` in `utils.ts`).
 */

export const EARTH = {
  radius: 1.0, // body radius — a normal (hero) planet; the CAMERA flies close, Earth never grows

  // Dot field (Fibonacci sphere → even coverage). Fewer dots = less overdraw when
  // the globe fills the screen (the main cost up close; the back half is culled).
  dotCount: 30000,
  dotCountMobile: 11000,
  dotSize: 5.5, // base point size (distance-attenuated) — tuned for the close-up
  dotMaxSize: 7, // hard cap (framebuffer px) so dots can't balloon up close → bounds overdraw
  shellJitter: 0.04, // tiny radial grain so the surface reads dotty like the Saturn

  // Lit by the ACTUAL sun (its world position) → a real day/night terminator
  // that sweeps as the globe spins + orbits. Ambient keeps the night side from
  // going fully black so the shadowed continents stay a little legible.
  light: {
    ambient: 0.4,
  },

  // Per-dot land/ocean, sampled from the mask (land = dark pixels).
  maskUrl: "/textures/earth-land-mask.png",
  landThreshold: 0.5, // mask luminance < this ⇒ land

  // Colours — brand palette: peach land, baby-blue ocean.
  landColor: "#FFA14A", // --color-peach (primary accent) → continents
  oceanColor: "#2489FF", // --color-baby-blue (secondary accent) → ocean
  landBright: 1.0, // brightness multiplier for land dots
  oceanBright: 0.55, // dimmer ocean so continents pop
  landDotScale: 1, // land grains thicker → continents read solid + prominent
  oceanDotScale: 0.6, // ocean grains thinner so the map stands out
  oceanDensity: 0.4, // keep only this fraction of OCEAN dots → more dots land on the continents (readable map) while the sphere still reads full

  // A dark inner sphere just under the dots hides the back-facing dots, so the
  // front continents read cleanly instead of showing through.
  coreColor: "#19191C", // --color-rich-black → the globe body sits in the same dark as the cosmos
  coreScale: 0.985, // fraction of radius

  // Motion.
  spin: 0.06, // idle self-spin (rad/sec) — a planet's day
  initialYaw: -1.54, // starting spin so the UK (where the pins are) faces the camera on arrival
  tilt: 0.41, // axial tilt (~23.5°) for a touch of realism
  dragSensitivity: 0.005, // rad per pixel dragged
  dragDamping: 0.1, // 0..1 follow speed
  spinResumeDelay: 0.8, // seconds after release before idle spin resumes
} as const;

/**
 * Earth's own orbit around the sun — a normal member on its own place (its slot
 * sits between Venus (7) and Mars (13)). It orbits continuously on the real-time
 * clock like the siblings; the camera flies to it and tracks it.
 */
export const EARTH_ORBIT = {
  // Sits in the clear gap between Jupiter (16) and the Saturn (~21.6) so Earth
  // never collides with a sibling, and is well clear of the sun's glow. CHANGE
  // THIS to move Earth's orbit (keep a margin of ~3 from 16 and ~21.6).
  radius: 18.5,
  speed: 0.05, // gentle continuous orbital speed (rad/sec)
  phase: 4.1, // starting angle
} as const;

/**
 * Arrival camera: sits at the Earth's LIVE position + this world offset, looking
 * at the Earth — so it tracks the orbiting planet and frames it close (Earth
 * fills the view by perspective, never by growing). Tune the distance/angle here.
 */
export const EARTH_CAM = {
  offset: [0, 0.5, 3.0] as [number, number, number],
  ease: 1.2, // easing exponent on the dive
} as const;
