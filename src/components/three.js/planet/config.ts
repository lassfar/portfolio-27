/**
 * Single source of truth for the About "planet" (a brand-tinted, dotty Saturn).
 *
 * Like the star scene, Three.js / GLSL can't read CSS variables, so the brand
 * palette is mirrored here. The warm band tones intentionally echo the tokens
 * in `src/styles/globals.css` (peach family); the rings lean on the blues.
 *
 * Everything tunable — palette, sizes, ring geometry, axial tilt, particle
 * counts and the rotation feel — lives here so it can be adjusted in one place.
 */

// ── Palette (brand-tinted Saturn) ─────────────────────────────────────────────

/** Warm banding of the planet body, pole → equator (mirrors the peach tokens). */
export const PLANET_PALETTE = {
  bandLight: "#ffe3c7", // light-peach — bright cream bands
  bandMid: "#ffa14a", // peach — the dominant warm band
  bandDark: "#ef7d14", // dark-peach — deeper orange bands
  bandDeep: "#7a3a08", // burnt shadow band (darker than dark-peach)
  pole: "#fff6ee", // bright warm-white polar caps (peach mixed to white)
} as const;

/** Ring particles — warm peach fading to white (no blue). */
export const RING_PALETTE = {
  tint: "#ffe3c7", // light-peach — the warm ring tint
  bright: "#ffffff", // bright white highlights
  dim: "#9c6638", // dim bands / inner shadow (muted warm brown)
} as const;

// ── Lighting ───────────────────────────────────────────────────────────────
//
// A single directional light in VIEW space — fixed relative to the camera, so
// the planet keeps a lit side and a shadowed side as it spins (like the photo).

export const LIGHT = {
  dir: [-0.4, 0.5, 0.8] as [number, number, number],
  ambient: 0.26, // how lit the dark side stays (0 = black, 1 = flat)
} as const;

// ── Camera ───────────────────────────────────────────────────────────────────

export const CAMERA = {
  z: 6,
  fov: 30,
} as const;

// ── Planet body ────────────────────────────────────────────────────────────

export const PLANET = {
  radius: 1.0,
  count: 70000, // desktop particle count
  countMobile: 28000, // reduced count on small screens
  size: 10, // base point size
  shellJitter: 0.04, // radial thickness of the particle shell (surface grain)
  bandFrequency: 9.0, // number of latitude bands
  bandWaviness: 0.0, // longitude warp of the bands (0 = perfectly straight bands)

  // Living motion as ZONAL flow: particles drift east-west AROUND the pole, so
  // the latitude bands stay straight while streaming (like a real gas giant).
  swirl: 0.06, // east-west drift amount (radians) — the main "alive" motion
  turbulence: 0.015, // gentle radial breathing (small → rounder silhouette)
  flowSpeed: 0.08, // how fast the flow field churns

  // Grainy rim: particles near the silhouette fade + scatter into loose dots.
  rimStart: 0.5, // fresnel threshold where the rim begins to dissolve (0..1)
  rimScatter: 0.05, // how far rim grains drift outward

  // Dust halo: a faint particle shell around the whole sphere (soft edges).
  haloFraction: 0.16, // share of particles that form the halo
  haloThickness: 0.2, // how far the halo reaches beyond the surface
  haloOpacity: 0.45, // halo dimness (0..1)
} as const;

// ── Rings ────────────────────────────────────────────────────────────────────

export const RING = {
  inner: 1.35,
  outer: 2.25,
  // The Cassini division — an empty gap band between inner and outer rings.
  cassiniStart: 1.7,
  cassiniEnd: 1.82,
  count: 36000, // desktop
  countMobile: 14000, // mobile
  size: 5,
  thickness: 0.045, // vertical scatter (×3 — gives the ring some depth)
  bandFrequency: 26.0, // fine radial brightness banding

  // Living motion: a faint IN-PLANE shimmer (x/z only) so particles sparkle
  // and drift without bobbing the ring vertically (keeps it flat & refined).
  shimmer: 0.012, // in-plane drift amount
  flowSpeed: 0.06, // shimmer churn speed
} as const;

// ── Scatter / formation (scroll-driven assembly) ─────────────────────────────
//
// On scroll into About the particles start dispersed across space (form = 0)
// and assemble into Saturn (form = 1), driven by the useAboutScroll store.

export const SCATTER = {
  spread: [14, 9, 9] as [number, number, number], // box size particles fill when dispersed
  drift: 0.3, // gentle floating of dispersed particles
  stagger: 0.4, // 0 = all assemble together; higher = more staggered arrival
} as const;

// ── Placement in the shared cosmic scene ─────────────────────────────────────
//
// Saturn lives in the Hero's unified Canvas (star camera: further back, wider
// FOV), so it's scaled up and centred where the star explodes.

export const SATURN = {
  scale: 1.5, // size within the shared (star) camera
  y: 0, // world Y — the star centres to 0 before it bursts, so Saturn forms here
} as const;

// ── Orientation ──────────────────────────────────────────────────────────────
//
// Tilt the whole planet+rings group so we view the rings slightly from above
// and the body is canted like the reference photo.

export const TILT = {
  x: 0.2, // pitch down → look onto the top of the rings (opens the ellipse)
  z: 0.4, // axial tilt / sideways lean (smaller = more upright planet)
} as const;

// ── Rotation feel (auto-spin + pointer drag) ─────────────────────────────────

export const ROTATION = {
  idleSpin: 0.06, // radians/sec of gentle self-rotation on the planet axis
  sensitivity: 0.004, // radians of view rotation per pixel dragged
  damping: 0.06, // 0..1 follow speed for the drag (higher = snappier)
} as const;
