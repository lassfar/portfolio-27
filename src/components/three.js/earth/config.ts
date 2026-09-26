import { EARTH_RADIUS } from "#/components/three.js/solar/config";

/**
 * The interactive Earth globe — the destination of the photography voyage (M2).
 *
 * Earth stays in the voyage's living-DOTS language (like the star, Saturn, sun
 * and sibling planets): a dense sphere of dots whose colour is sampled per-dot
 * from a real equirectangular land/ocean map, so the continents read clearly
 * (land = warm/bright, ocean = dim blue).
 *
 * Earth is a NORMAL orbiting member of the solar system — the 3rd planet, on its real
 * orbit (EARTH_ELEMENTS in solar/config) — it never grows or transitions. The CAMERA flies to it and
 * tracks its orbit (like the Saturn), so it fills the view purely by perspective
 * while the rest of the system fades. You can drag-rotate it, and it resumes a
 * gentle idle self-spin when released — a real planet's day. Real city photo-pins
 * land on it in M3 (see `data.ts` + `latLngToVector3` in `utils.ts`).
 */

export const EARTH = {
  // Its REAL size next to the Saturn (≈ 0.159, see EARTH_RADIUS) — a speck in the wide
  // view. The CAMERA flies close (EARTH_CAM, in Earth radii); the Earth never grows.
  radius: EARTH_RADIUS,

  // Dot field (Fibonacci sphere → even coverage). Fewer dots = less overdraw when
  // the globe fills the screen (the main cost up close; the back half is culled).
  dotCount: 30000,
  dotCountMobile: 11000,
  dotSize: 5.5 * EARTH_RADIUS, // base point size (distance-attenuated, so × the radius) — tuned for the close-up
  dotMaxSize: 7, // hard cap (framebuffer px) so dots can't balloon up close → bounds overdraw
  shellJitter: 0.04, // tiny radial grain so the surface reads dotty like the Saturn
  // Level of detail while it's a speck: far away every dot is a 1 px point and each
  // screen pixel shows the last dot drawn there, so only enough dots to keep every
  // pixel covered are drawn — the full field is back from ~14 px (the whole approach,
  // dive and dwell draw every dot, exactly as before).
  lod: {
    perPixel: 8, // fewest dots per screen pixel in open ocean (its sparsest part) — an empty pixel ≈ 0.03%
    fadeBand: 0.13, // share of the drawn dots that fade in / out at the edge of the count (as PLANET_LOD)
  },

  // Lit by the ACTUAL sun (its world position) → a real day/night terminator
  // that sweeps as the globe spins + orbits. Ambient keeps the night side from
  // going fully black so the shadowed continents stay a little legible.
  light: {
    ambient: 0.2, // a clear day/night terminator; the continents stay faintly visible at night
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

  // A solid dark core just under the dots: the globe reads as a solid planet — the
  // back-facing dots, the Moon, the Sun and the stars behind it never show through the
  // gaps between its dots. It fades with the Earth.
  showCore: true,
  coreColor: "#19191C", // --color-rich-black → the globe body sits in the same dark as the cosmos
  coreScale: 0.97, // fraction of radius — just under the lowest dots (the shell grain reaches 0.98)

  // Motion.
  spin: 0.06, // idle self-spin (rad/sec) — a planet's day
  initialYaw: -1.54, // starting spin so the UK (where the pins are) faces the camera on arrival
  tilt: 0.41, // axial tilt (~23.5°) for a touch of realism
  dragSensitivity: 0.005, // rad per pixel dragged
  dragDamping: 0.1, // 0..1 follow speed
  spinResumeDelay: 0.8, // seconds after release before idle spin resumes

  // Photo-pins.
  pinLabelsAt: 0.85, // approach (0..1) at/after which every visible pin's label stays shown ("full view")
} as const;

/**
 * Arrival camera: sits at the Earth's LIVE position + this offset, looking at the
 * Earth — so it tracks the orbiting planet and frames it close (Earth fills the view
 * by perspective, never by growing). The offset is in Earth radii, so the close-up
 * frames the same whatever the Earth's size. Tune the distance/angle here.
 */
export const EARTH_CAM = {
  offset: [0, 0.5 * EARTH_RADIUS, 3.0 * EARTH_RADIUS] as [number, number, number],
  // The dive's easing is easeInOutCubic (see CameraRig segment 2) — it glides to
  // REST as the Earth fills the frame, so the planet settles smoothly into its
  // dwell instead of arriving abruptly.
  // How the distance to the Earth closes over the dive: 0 = at a steady speed (the
  // tiny real-size Earth then only balloons at the very end), 1 = a steady ZOOM (the
  // distance shrinks by the same factor each step, so the Earth grows evenly).
  steadyZoom: 1,
  // The Earth is the 3rd planet, so the dive can pass the Sun: the camera's path bends
  // around it and never comes closer than this to the Sun's centre (its dots + corona
  // reach ~4.7). See CameraRig segment 2.
  sunClear: 6.5,
} as const;
