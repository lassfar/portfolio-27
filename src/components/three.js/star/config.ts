/**
 * Single source of truth for the Hero "star" 3D scene.
 *
 * Three.js and WebGL shaders can't read CSS variables, so the scene's palette is
 * mirrored here in JS/GLSL form. The warm tones intentionally match the brand
 * tokens in `src/styles/globals.css` (e.g. `--color-peach`); if the brand
 * palette changes, update both.
 *
 * Everything tunable about the scene — colours, sizes, the drag feel, and the
 * scroll-driven zoom/explosion timing — lives here, so it can be adjusted in one
 * place instead of hunting through the components.
 */

// ── Palette ──────────────────────────────────────────────────────────────────

/** Nebula particle colours (hex → per-particle Color values). */
export const NEBULA_PALETTE = {
  blue: "#2563ff", // deep nebula blue
  coreCenter: "#cfe0ff", // soft light-blue at the very center
  innerShell: "#9cc0ff", // blue-white inner shell
  gasHot: "#e24b4a", // red — inner edge of the warm gas
  gasWarm: "#ff9a4a", // peach — outer gas (mirrors --color-peach)
} as const;

/** Core-glow gradient colours as RGB triplets (0..1) for the GLSL shader. */
export const GLOW_PALETTE = {
  center: [0.83, 0.9, 1.0],
  edge: [0.15, 0.39, 1.0],
} as const;

/** Starfield point colour. */
export const STARFIELD_COLOR = "#ffffff";

// ── Camera & post-processing ─────────────────────────────────────────────────

export const CAMERA = {
  z: 7, // distance back from origin — the plane the star flies through on zoom
  fov: 55,
} as const;

export const BLOOM = {
  intensity: 0.9,
  threshold: 0.45,
  smoothing: 0.9,
  radius: 0.7,
} as const;

// ── Layout / sizing ──────────────────────────────────────────────────────────

export const LAYOUT = {
  starY: 1.6, // world Y of the star — also the axis everything rotates around
  nebulaScale: 0.45, // intrinsic size of the nebula group
  glowSize: 3.4, // core-glow plane size (before nebulaScale)
} as const;

// ── Particles ────────────────────────────────────────────────────────────────

export const PARTICLES = {
  count: 50000, // desktop count
  countMobile: 18000, // reduced count on small screens
  size: 12,
  turbulence: 0.28,
  explodeDistance: 3.5, // how far particles fly outward at full burst
  explodeScatter: 2.0, // extra turbulent scatter at full burst
} as const;

export const STARFIELD = {
  count: 1800,
  size: 0.05,
  minRadius: 11,
  radiusSpread: 24, // particles sit between minRadius and minRadius + radiusSpread
} as const;

// ── Drag rotation ────────────────────────────────────────────────────────────

export const ROTATION = {
  sensitivity: 0.003, // radians of rotation per pixel dragged
  damping: 0.03, // 0..1 follow speed (higher = snappier)
  idleDrift: 0.02, // radians/sec of gentle auto-rotation
  allowVerticalDrag: false, // let the user tilt the scene up/down by dragging (false = horizontal only)
} as const;

// ── Scroll sequence ──────────────────────────────────────────────────────────
//
// All thresholds below are hero scroll progress (0..1). The full choreography:
//
//   0.00–0.20  content lifts + fades out
//   0.24–0.48  star travels top → center
//   0.24–0.62  star zooms in CONTINUOUSLY (no hold), reaching exactly the
//              viewport height (100vh) at the moment it bursts
//   0.62–0.85  explosion (particles burst outward; core glow dissolves with them)
//   0.82–1.00  debris flies through the camera
//   0.90–1.00  fades out → About

/** The progress at which the star fills the screen and detonates. */
const EXPLOSION_START = 0.62;

/** Pin + content exit (read by the DOM-side Hero, hence the GSAP-friendly form). */
export const HERO_SCROLL = {
  pinLength: "+=220%", // total scroll the pinned hero spans
  contentExit: 0.2, // fraction of the timeline over which the content leaves
} as const;

/**
 * The unified Hero→About "journey": one pinned ScrollTrigger drives BOTH the
 * star (useHeroScroll) and Saturn's assembly (useAboutScroll).
 *
 * The star keeps its original ~220% of scroll feel: it plays over 0..starSpan
 * of the journey. Saturn assembles over assembleStart..1, overlapping the
 * star's burst so the explosion debris hands off into the planet.
 */
export const JOURNEY = {
  // Phase thresholds are fractions of pinLength. The scroll Saturn takes to
  // build = (assembleEnd − assembleStart) × pinLength. To give it MORE build
  // scroll, widen that gap and bump pinLength to match (these keep the star at
  // ≈220% of a viewport while the assembly gets ≈260%).
  pinLength: "+=860%", // total pinned scroll for star → Saturn → reveal → text fill
  starSpan: 0.256, // star plays over 0..starSpan (≈220% of 860%)
  assembleStart: 0.233, // Saturn assembles over assembleStart..assembleEnd (overlaps the burst)
  assembleEnd: 0.535, // Saturn fully built by here — ≈260% of scroll to build
  contentExit: 0.08, // fraction of the journey over which the hero copy lifts away

  // Horizontal scene rotation (whole cosmos turns together, on top of the slow
  // auto-spin + drag). Tune these to change how much it turns.
  scrollTurnsStar: 0.5, // full turns as the star plays (start → explosion)
  scrollTurnsPlanet: 0.5, // full turns as Saturn assembles (→ fully visible)
  scrollSpinDamping: 0.06, // 0..1 — lower = smoother / slower response to scroll

  // One-time intro spin on first render. Full speed immediately, finishing in
  // sync with the hero text intro (duration comes from that timeline).
  introTurns: 1, // full horizontal turns on load

  // End reveal: once Saturn is built, the cosmos blurs + dims and the About copy
  // slides in over it — scrubbed over revealStart..1 (the tail of the journey).
  // The gap between assembleEnd and revealStart is a stretch of scroll where the
  // finished planet just rests before the reveal (widen the gap for more).
  revealStart: 0.57, // journey progress where the blur + text slide-in begins
  revealBlur: 64, // px of blur on the cosmos (matches Tailwind blur-3xl)
  revealDim: 0.6, // brightness multiplier on the cosmos (slight dim)

  // After the gray text has slid in, the letters colour in (gray → white, the
  // title to its own colours) as you keep scrolling — over fillStart..1.
  fillStart: 0.628, // journey progress where the per-letter/word colour fill begins (≈320% of scroll → slower fill)
} as const;

/** Camera-less "zoom": centering, growing and the fly-through (Universe). */
export const ZOOM = {
  centerStart: 0.24,
  centerEnd: 0.48,
  growStart: 0.24,
  growEnd: EXPLOSION_START, // grow right up to the burst — no fixed hold
  flyStart: 0.82,
  flyDistance: 10, // world units travelled toward the camera
  damping: 0.12,
} as const;

/** The burst and fade-out (Nebula). */
export const BURST = {
  explosionStart: EXPLOSION_START,
  explosionEnd: 0.85,
  fadeStart: 0.9,
} as const;

// ── Screen-fill scale (derived) ──────────────────────────────────────────────
//
// The vertical world-space height the camera sees at the star's resting
// distance. Depends only on the (vertical) FOV and the camera distance — NOT on
// aspect ratio — so a star scaled to this height fills 100vh on any screen.
const VIEWPORT_WORLD_HEIGHT =
  2 * CAMERA.z * Math.tan((CAMERA.fov * Math.PI) / 180 / 2);

/**
 * Effective visible radius of the nebula in its own local units (i.e. before
 * `LAYOUT.nebulaScale`). The particle cloud has soft, bloomed edges with no hard
 * boundary, so this is an eyeball-tuned value, not a strict geometric bound —
 * raise it to make the star burst "earlier" (at a smaller scale), lower it to
 * let the star grow larger before it fills the frame.
 */
export const NEBULA_VISIBLE_RADIUS = 2.4;

/**
 * The zoom scale at which the star's visible diameter equals the viewport
 * height (100vh). Growth ramps to exactly this by `ZOOM.growEnd`, so the star
 * fills the screen at the instant it explodes.
 */
export const SCREEN_FILL_SCALE =
  VIEWPORT_WORLD_HEIGHT / 2 / (NEBULA_VISIBLE_RADIUS * LAYOUT.nebulaScale);
