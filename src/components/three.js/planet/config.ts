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

// ── Growth while constructing (scale toward full as particles land) ──────────
//
// While the particles fly in, the whole planet eases from `startScale` to full
// size (1.0) as it lands — so it "resolves into place" instead of snapping to
// full size immediately: it GROWS in if startScale < 1, or CONDENSES in from
// oversized if startScale > 1. An optional overshoot pops just past full before
// settling. Applied to the body AND the rings (same curve) so Saturn resolves as
// one — a pure function of the assembly progress, so it scrubs/reverses cleanly.

export const GROWTH = {
  startScale: 2, // planet scale at the START of construction (eases to 1.0 = full)
  overshoot: 0, // extra pop just past full before settling (0 = none)
} as const;

// ── Placement in the shared cosmic scene ─────────────────────────────────────
//
// Saturn lives in the Hero's unified Canvas (star camera: further back, wider
// FOV), so it's scaled up and centred where the star explodes.

export const SATURN = {
  scale: 1.5, // size within the shared (star) camera
  y: 0, // world Y — the star centres to 0 before it bursts, so Saturn forms here
} as const;

// ── Fly-out (the voyage begins) ──────────────────────────────────────────────
//
// After the Craft fades and reveals the built Saturn, the CAMERA flies straight
// back from it (a real dolly, like a rocket pulling away through space): the
// Saturn stays put + intact and shrinks by perspective, and the solar system it
// belongs to opens up behind it. Driven by `useVoyageScroll` (0 = resting at the
// Saturn, 1 = the whole system in view). A pure function of the voyage, so it
// scrubs and reverses cleanly. Built as a scalable camera path so a galaxy zoom
// can nest on top later.

export const FLYOUT = {
  distance: 30, // world units the camera pulls back (+z) over the voyage
  rise: 16, // world units the camera rises (+y) over the voyage — the cinematic
  //          high angle: it then looks DOWN onto the flat orbital plane so the
  //          orbits read as wide flattened ellipses (like a solar-system poster).
  //          The camera also eases its look-target from the fixed Saturn (origin)
  //          to the sun, so the view settles sun-centred with the Saturn aside.
  ease: 1.1, // >1 = gentle start, accelerating away
  damping: 0.09, // 0..1 follow speed for the move (lower = smoother/laggier)
  // The Saturn is a PERSISTENT member now (it stays and flies), so it must keep
  // its full density — no thinning. (Kept as a knob for a possible distance LOD
  // on the sibling planets later; 0 = solid.)
  thinMax: 0, // fraction of Saturn dots dropped at full fly-out (0 = stays solid)
} as const;

// ── Orientation ──────────────────────────────────────────────────────────────
//
// Tilt the whole planet+rings group so we view the rings slightly from above
// and the body is canted like the reference photo.

export const TILT = {
  x: 0.1, // pitch down → look onto the top of the rings (opens the ellipse)
  z: 0.25, // axial tilt / sideways lean (smaller = more upright planet)
} as const;

// ── Rotation feel (auto-spin + pointer drag) ─────────────────────────────────

export const ROTATION = {
  idleSpin: 0.06, // radians/sec of gentle self-rotation on the planet axis
  sensitivity: 0.004, // radians of view rotation per pixel dragged
  damping: 0.06, // 0..1 follow speed for the drag (higher = snappier)
} as const;

// ── Assembly resolve (land on the default pose) ──────────────────────────────
//
// In the shared cosmic scene the planet turns WITH the cosmos as it assembles,
// but its rotation is resolved (as a pure function of the assembly progress) so
// that the moment it's fully built it settles into its canonical pose. It spins
// with a little extra turn and eases (decelerates) into place; once landed it
// hands rotation back to the scene (drag + idle drift) as before.

export const ASSEMBLY = {
  // Fine-tune offset (radians) on the landed yaw — nudge the exact face the
  // finished planet presents without touching the scroll turn amounts.
  poseYaw: 0,
  // Extra full turns spun during the build, decaying to 0 at completion (the
  // "spin, then decelerate into place"). 0 = only the natural resolve turn.
  spinTurns: 1,
  // The self-spin is parked at this axis phase (radians) while building, so the
  // planet lands on a deterministic face; the idle spin resumes once built.
  spinPose: 0,
} as const;
