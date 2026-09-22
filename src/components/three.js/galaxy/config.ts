/**
 * The Galaxy — the journey's grand finale (Contact). Scrolling past the Lab drives
 * ONE continuous exponential zoom-OUT: the camera pulls BACK from the Voyager, the
 * solar system re-appears as a tiny cluster centred in the frame, then shrinks as
 * we fly out through the surrounding stars until this dotted, brand-tinted spiral
 * — peach core → baby-blue arms, coral star-forming knots — resolves whole. The
 * emotional beat: we were inside a galaxy we couldn't see, until we flew far
 * enough away to see the whole picture. Driven by `useGalaxyScroll`.
 *
 * The LOOK was dialled + signed off in `docs/prototypes/galaxy.html` (Phase 1);
 * the MOTION (this exponential pull-out) in `docs/prototypes/galaxy-zoom.html`
 * (Phase 3). The galaxy is built FLAT — the inclined view comes from the camera
 * climbing above the disc (`GALAXY_ZOOM.endDir`), not from tilting the geometry.
 */

import { Euler, Vector3 } from "three";
import { SUNPOS } from "#/components/three.js/solar/config";

export const GALAXY = {
  // ── Generation (the locked look) ────────────────────────────────────────────
  seed: 2922,
  count: 90000, // desktop dot count
  countMobile: 31500, // 90000 × 0.35
  discRadius: 10.5, // Rmax — the disc's outer edge (LOCAL units, before GALAXY_SCALE)
  discScaleLength: 3.2, // exponential-disc scale length H
  discThickness: 0.3, // gaussian half-thickness of the thin disc
  bulgeRadius: 2.5,
  bulgeFlatten: 0.6,
  armCount: 3,
  pitchDeg: 18, // spiral pitch (tightness) — smaller = more wound
  armPhase: 0,
  armWidth: 1.0, // gaussian arm fuzz (physical width)
  ridgeGain: 0.6, // brightness boost along each arm's spine
  dustAt: 0.14, // dust-lane offset on the trailing arm edge
  dustWidth: 0.06,
  dustDepth: 0.45, // how strongly the lane rejects dots
  tWarm: 0.14, // warm-core radius fraction
  tBlue: 0.55, // peach→baby-blue crossover (blue/peach balance)
  knotCount: 55, // coral star-forming clusters
  dotsPerKnot: 40,
  standoutFraction: 0.03, // resolved-star sprinkle

  // ── Pose (the locked look study — docs/prototypes/galaxy.html) ───────────────
  // Baked into the GEOMETRY (a tilt group), viewed from GALAXY_ZOOM.endDir with the
  // camera upright — exactly reproducing the study's inclined-spiral pose.
  inclination: 74, // deg — 0 = face-on, 90 = edge-on
  roll: -23, // deg — position angle of the major axis

  // ── Motion ───────────────────────────────────────────────────────────────────
  spinSpeed: 0.03, // rad/s — the galaxy turns gently on its own axis (about its centre)
  // The whole real solar system REVOLVES about the galactic centre with the spin, so
  // it "flies" through the galaxy in its arm. The revolve persists while the finale
  // is on-screen (the camera zooms into the Sun at its CURRENT flown position on
  // scroll-back), and only resets once we're back below this galaxy-progress (the
  // system is hidden there, so the reset is invisible). See galaxy/spin.ts.
  flyResetBelow: 0.02,

  // ── Render (site dot language) ──────────────────────────────────────────────
  // FIXED screen size: the galaxy dots keep a constant pixel size through the whole
  // zoom (no perspective blow-up when the camera is inside/close), so they read as
  // crisp stars at every distance. `uMaxSize` is unused for the galaxy (kept for the
  // shared shader signature). Tuned to match the disc's full-view look.
  uSize: 1.0, // px — constant on-screen dot size
  uMaxSize: 75,
  twinkleAmount: 0.49,
  coreOpacity: 0.22, // core-glow billboard opacity (blooms in late — see coreGlowIn)
  coreScale: 3.6, // core-glow size = coreScale × bulgeRadius (× GALAXY_SCALE)

  // ── Reveal window, in `useGalaxyScroll` progress (0..1 over the galaxy beat) ──
  // The galaxy stays HIDDEN through the opening beats — the Voyager fading out, then
  // the REAL solar system re-appearing "fully visible" (see solar/reveal.ts) — so no
  // galaxy stars clutter the craft or the system. It only begins resolving once the
  // pull-out has framed the system and starts panning to the centre (≈ panSunEnd),
  // then fills in as the whole spiral frames up.
  revealStart: 0.44,
  revealEnd: 0.82,
  // The warm core-glow blooms in LATER — while we look toward the Sun (away from the
  // galaxy centre) it stays quiet, then swells as the whole disc frames up.
  coreGlowIn: [0.6, 0.92] as [number, number],
} as const;

/** Brand palette mirrored for the GLSL/JS dot colours (see globals.css @theme). */
export const GALAXY_PALETTE = {
  peach: "#ffa14a",
  lpeach: "#ffe3c7",
  dpeach: "#ef7d14",
  babyBlue: "#2489ff",
  lbabyBlue: "#c5e0ff",
  nebulaBlue: "#2563ff",
  coral: "#e24b4a",
  coreWhite: "#cfe0ff",
} as const;

// ── Placement + scale ──────────────────────────────────────────────────────────
//
// The whole sub-scene is scaled up so the camera's START distance (the Voyager
// framing distance, ≈ 4.9 world units) equals the prototype's closest zoom — that
// keeps the camera near-plane at a normal 0.1 (no logarithmic depth buffer) while
// preserving the prototype's proportions (dEnd/dStart and dEnd/Rmax). Fixed-size
// galaxy dots are scale-invariant; only the attenuated speck's uSize scales with S.

/** World scale factor applied to the galaxy geometry + the solar speck. */
export const GALAXY_SCALE = 54;

/** The Sun's fractional radius out in the disc (our Sun sits ~⅔ out its arm). */
export const GALAXY_SOLAR_R = 0.62;

/** The galaxy's outer radius in WORLD units (after scale). */
const RMAX_WORLD = GALAXY.discRadius * GALAXY_SCALE; // ≈ 567

/** The Sun's arm radius from the galactic centre, in WORLD units. */
export const SUN_ARM_RADIUS = RMAX_WORLD * GALAXY_SOLAR_R; // ≈ 351

/**
 * The disc TILT, as a group Euler [x, y, z] in radians — the exact look-study pose
 * (`rotation.x = 90 − inclination`, `rotation.z = roll`). Baked into the geometry AND
 * used to place the Sun in the tilted disc and to revolve it about the disc normal.
 */
export const GALAXY_TILT: [number, number, number] = [
  (Math.PI / 180) * (90 - GALAXY.inclination),
  0,
  (Math.PI / 180) * GALAXY.roll,
];

/**
 * The galaxy CENTRE — placed so the REAL Sun (`SUNPOS`) sits `GALAXY_SOLAR_R` of the
 * way out in a spiral arm, IN the tilted disc plane. `GALAXY_CENTER = SUNPOS −
 * tilt·(SUN_ARM_RADIUS, 0, 0)`, i.e. the Sun's in-plane arm offset rotated by the
 * disc tilt. So the Sun genuinely lies in the inclined disc — our "You are here".
 */
export const GALAXY_CENTER: [number, number, number] = (() => {
  const [tx, , tz] = GALAXY_TILT;
  const v = new Vector3(SUN_ARM_RADIUS, 0, 0).applyEuler(
    new Euler(tx, 0, tz)
  );
  return [SUNPOS[0] - v.x, SUNPOS[1] - v.y, SUNPOS[2] - v.z];
})();

/**
 * The exponential pull-out camera (the finale motion). `dStart`/`startDir`/
 * `lookStart` are DERIVED in the CameraRig from `LAB_CAM` so the beat opens exactly
 * on the Voyager rest pose (seamless hand-off); the values below frame the END.
 *
 * `endDir`/`dEnd` reproduce the look study's camera (position (0, 3.2, 19) looking at
 * the tilted galaxy, upright) — the disc's inclined pose comes from the GEOMETRY tilt,
 * so the camera just looks head-on from slightly above.
 */
export const GALAXY_ZOOM = {
  dEnd: RMAX_WORLD * (19.3 / 10.5), // ≈ 1042 — the study's framing distance, scaled
  endDir: [0, 3.2, 19] as [number, number, number], // study camera dir (upright, slightly above)
  curve: 1.0, // accel curve on the eased look/dir lerp (1 = smoothstep)
  // The camera's AIM pans in two legs: Voyager → the (flying) Sun — framing the whole
  // real solar system — over [0, panSunEnd], then Sun → the galaxy centre over
  // [panSunEnd, 1]. Anchored on the LIVE Sun position, so scrolling back zooms into
  // the solar system wherever it has flown to in the galaxy.
  panSunEnd: 0.44,
} as const;
