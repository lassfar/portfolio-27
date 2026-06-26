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
} as const;

// ── Scroll sequence ──────────────────────────────────────────────────────────
//
// All thresholds below are hero scroll progress (0..1). The full choreography:
//
//   0.00–0.20  content lifts + fades out
//   0.24–0.48  star travels top → center
//   0.34–0.58  blue core glow erodes from its outer edge
//   0.48–0.62  star HOLDS at center
//   0.62–0.85  explosion (particles burst outward)
//   0.82–1.00  debris flies through the camera
//   0.90–1.00  fades out → About

/** Pin + content exit (read by the DOM-side Hero, hence the GSAP-friendly form). */
export const HERO_SCROLL = {
  pinLength: "+=220%", // total scroll the pinned hero spans
  contentExit: 0.2, // fraction of the timeline over which the content leaves
} as const;

/** Camera-less "zoom": centering, growing and the fly-through (Universe). */
export const ZOOM = {
  centerStart: 0.24,
  centerEnd: 0.48,
  growStart: 0.24,
  growEnd: 0.5,
  scaleGain: 2, // how much bigger the star grows (× on top of 1)
  flyStart: 0.82,
  flyDistance: 10, // world units travelled toward the camera
  damping: 0.12,
} as const;

/** The burst, fade-out and glow erosion (Nebula). */
export const BURST = {
  explosionStart: 0.62, // after the star has held at center for a while
  explosionEnd: 0.85,
  fadeStart: 0.9,
  glowErodeStart: 0.34,
  glowErodeEnd: 0.58,
} as const;
