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

// `GALAXY` and `GALAXY_FX` are deliberately MUTABLE: the values below are the
// defaults, and the dev tuning panel (`GalaxyGui`, `npm run dev` or `?gui`) adjusts
// them live. Everything that uses them reads them every frame (or rebuilds on demand).
export const GALAXY = {
  // ── Generation (the realistic look — docs/prototypes/galaxy-zoom-realistic.html) ──
  // One arm model drives four layers (stars, star-forming regions, soft glow, dust),
  // so the dust and glow sit exactly on the arms. Built by `buildGalaxyLayers`.
  seed: 9264,
  count: 90000, // desktop star-dot count
  countMobile: 31500, // 90000 × 0.35
  auxMobile: 0.5, // glow/dust density factor on small screens
  discRadius: 10.5, // Rmax — the disc's outer edge (LOCAL units, before GALAXY_SCALE)
  discScaleLength: 3.2, // exponential-disc scale length H
  discThickness: 0.3, // gaussian half-thickness of the thin disc
  bulgeRadius: 2.5,
  bulgeFlatten: 0.6,
  armCount: 4,
  pitchDeg: 14, // spiral pitch (tightness) — smaller = more wound
  armPhase: 0,
  armWidth: 2, // gaussian arm fuzz (physical width)
  ridgeGain: 0.6, // brightness boost along each arm's spine
  clumpiness: 0.55, // knotty arms: 0 = smooth bands, 1 = very clumpy
  clumpFreq: 1.3,
  tWarm: 0.14, // warm-core radius fraction
  tBlue: 0.5, // peach→baby-blue crossover (blue/peach balance)
  interArmDim: 0.45, // the space between the arms is dimmer (old stars)
  // Star-forming regions (coral-pink, on each arm's OUTER edge) + young blue clusters.
  hiiCount: 170,
  hiiOffset: 0.35,
  blueClusters: 120,
  // Dust (dark-peach brown, on each arm's INNER edge): a broken lane + feathers + patches.
  dustOffset: 0.36,
  dustWidth: 0.11,
  dustBreak: 0.55, // higher = more gaps in the lanes
  featherRate: 0.09, // short dust wisps crossing the arms
  dustPatches: 2600,
  // Soft edges — the disc melts into the space around it instead of ending on a rim:
  // sparse outer stars trailing off past the disc, a faint wide glow envelope, and the
  // outer glow turning larger + fainter (live, in the shader).
  outerStars: 0.04, // share of `count` added as sparse stars past the disc edge
  envelope: 1, // brightness of the faint outer glow envelope (0 = none)
  edgeSoftness: 0.7, // 0 = crisp rim, 1 = outer glow fully diffused (live)

  // ── Pose (the locked look study — docs/prototypes/galaxy.html) ───────────────
  // Baked into the GEOMETRY (a tilt group), viewed from GALAXY_ZOOM.endDir with the
  // camera upright — exactly reproducing the study's inclined-spiral pose.
  inclination: 74, // deg — 0 = face-on, 90 = edge-on
  roll: -23, // deg — position angle of the major axis
  // The full view CENTRES the galaxy on screen (the camera turns a little from the core
  // toward the middle of the tilted disc — pose unchanged): 0 = aim at the core, 1 =
  // centre the whole disc rim (its faint outer edge makes that sit a bit high).
  frameCentering: 0.7,

  // ── Motion ───────────────────────────────────────────────────────────────────
  spinSpeed: 0.015, // rad/s — the galaxy turns gently on its own axis (about its centre)
  differential: 0.001, // tiny inner/outer shear, shared by every layer so dust stays on the arms
  // The whole real solar system REVOLVES about the galactic centre with the spin, so
  // it "flies" through the galaxy in its arm — the Voyager with it. It flies while the
  // system is on screen (from `flyFrom`, when it starts to re-appear), persists on
  // scroll-back (the camera zooms into the Sun at its CURRENT flown position), and only
  // resets right back at the Voyager (below `flyResetBelow`). See galaxy/spin.ts.
  flyFrom: 0.03,
  flyResetBelow: 0.002,
  paused: false, // freeze the spin (and the solar system's flight) — for tuning
  // While the galaxy is revealed, the view CIRCLES around it — sideways (about the
  // vertical, like walking around it), against its own spin — and settles into the
  // designed pose as the full view frames up. Degrees in total; negative = the other way.
  // It's ONE move with the zoom-out: driven by the same progress, so the two start
  // from rest and glide to rest together, at a pace that suits something this huge.
  revealOrbit: 120,
  // How much of the turn is saved for the end: 1 = evenly along the zoom-out, higher =
  // more of it late (2 ≈ half of the turn in the last 30% of the reveal).
  revealOrbitLate: 2,

  // ── Render ──────────────────────────────────────────────────────────────────
  // Star dots keep a FIXED size on screen through the whole zoom (they never balloon
  // when the camera is inside/close), in the site's dot language.
  uSize: 1.0, // px — constant on-screen dot size
  twinkleAmount: 0.05,
  // Extra dot brightness DURING the flight out through the galaxy: from inside it the
  // dots are spread over the whole screen (and still fading in), so they read dim. It
  // ramps in as the galaxy appears and back out as the full view settles, so the
  // full view keeps its tuned look. (0 = none, 0.6 = +60%.) Galaxy progress windows.
  flightBoost: 0.6,
  flightBoostIn: [0.44, 0.6] as [number, number],
  flightBoostOut: [0.85, 1] as [number, number],
  knotBrightness: 1.0, // the pink star-forming regions
  // Soft glow + dust have a REAL size in space (world-attenuated). Each sprite fades
  // out when it's close to the camera, so from INSIDE the galaxy they only show in the
  // distance (a Milky-Way band with dust) and never balloon into blobs up close.
  glowAmount: 0.235,
  glowSize: 260, // (× GALAXY_SCALE in the shader)
  dustOpacity: 0.9, // how dark the dust lanes are
  dustSize: 250, // (× GALAXY_SCALE in the shader)
  nearFadeStart: 0, // LOCAL galaxy units: glow/dust invisible closer than this…
  nearFadeEnd: 7, // …and fully visible beyond this
  coreOpacity: 0.3, // core-glow billboard opacity (blooms in late — see coreGlowIn)
  coreScale: 5.5, // core-glow size = coreScale × bulgeRadius (× GALAXY_SCALE)
  // Extra core glow DURING the flight (same window as `flightBoost`): the core's own
  // glow only swells in late (`coreGlowIn`), so from inside the galaxy the bulge read
  // as a flat grey cluster — this lights its tight centre (not the wide halo) on the
  // way out, easing back to the tuned look for the full view.
  coreFlightBoost: 0.4,

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
};

/**
 * Finale-only effects + the sparkly foreground stars.
 *
 * The galaxy has its OWN bloom, done in screen values on the galaxy layer only (see
 * `GalaxyBloom`) — like the prototype, whose bloom only ever saw the galaxy. The
 * site-wide bloom stays off in the finale (it greys the arms and blows the Sun into a
 * blob). The soft highlight roll-off blends in over `fxIn` (the galaxy's own reveal),
 * so every earlier beat is untouched (see BloomController).
 */
export const GALAXY_FX = {
  fxIn: [0.44, 0.82] as [number, number],
  // Layer switches (the prototypes' "Compare" panel).
  showGlow: true,
  showDust: true,
  showBloom: true,
  showSparkles: true,
  bloomStrength: 0.55, // as tuned in the prototype
  bloomRadius: 0.5,
  bloomThreshold: 0.66, // screen brightness
  // Brightness above this rolls off softly instead of clipping to a hard white edge
  // (the scene renders in half-float, so there's headroom above 1).
  highlightKnee: 0.64,
  // The page colour (globals.css --color-rich-black), which the galaxy layer bakes in
  // under its light as it appears — see COMPOSITE_FRAG.
  pageBackground: "#19191c",
  sparkles: {
    count: 16,
    size: 62, // px (× device pixel ratio)
    spikes: 1.15, // strength of the cross-shaped sparkle
    fadeIn: [0.8, 0.95] as [number, number], // appear with the full galaxy view
  },
};

/**
 * The space AROUND the galaxy, so it's part of the universe rather than an object on
 * a black backdrop: a deep field of tiny far stars all around, a few faint distant
 * galaxies, and a drag that turns it all together (see galaxy/spin.ts).
 *
 * The deep field + distant galaxies are infinitely far (pinned to the camera, so they
 * never parallax during the zoom) and drawn in the galaxy's display-space layer, under
 * the dust — so the dust lanes darken the stars behind them. The deep stars take over
 * from the near starfield as it fades (`Starfield`, galaxy 0.2 → 0.55), so there are
 * always stars around you; the distant galaxies appear as the whole spiral frames up.
 */
export const GALAXY_SPACE = {
  showStars: true,
  starCount: 20000, // over the whole sky (~1/12 of them in view at once)
  starCountMobile: 8000,
  starSize: 1.0, // px — the galaxy's own dot size
  starBrightness: 1.0,
  starsIn: [0.25, 0.6] as [number, number],
  showGalaxies: true,
  galaxyBrightness: 1.0,
  galaxySize: 1.5, // × each galaxy's designed size
  galaxiesIn: [0.62, 0.92] as [number, number],
  // A drag turns the galaxy + its space with the rest of the cosmos.
  dragTurns: true,
};

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

/** The galaxy's outer radius in WORLD units at the default size (frames the END view). */
const RMAX_WORLD = GALAXY.discRadius * GALAXY_SCALE; // ≈ 567

/** Live placement values (see `updateGalaxyPlacement`). */
export const GALAXY_PLACEMENT = {
  /** The Sun's arm radius from the galactic centre, in WORLD units (≈ 351). */
  sunArmRadius: 0,
};

/**
 * The disc TILT, as a group Euler [x, y, z] in radians — the exact look-study pose
 * (`rotation.x = 90 − inclination`, `rotation.z = roll`). Baked into the geometry AND
 * used to place the Sun in the tilted disc and to revolve it about the disc normal.
 * Updated in place by `updateGalaxyPlacement`.
 */
export const GALAXY_TILT: [number, number, number] = [0, 0, 0];

/**
 * The galaxy CENTRE — placed so the REAL Sun (`SUNPOS`) sits `GALAXY_SOLAR_R` of the
 * way out in a spiral arm, IN the tilted disc plane. `GALAXY_CENTER = SUNPOS −
 * tilt·(sunArmRadius, 0, 0)`, i.e. the Sun's in-plane arm offset rotated by the disc
 * tilt. So the Sun genuinely lies in the inclined disc — our "You are here". Updated in
 * place by `updateGalaxyPlacement`.
 */
export const GALAXY_CENTER: [number, number, number] = [0, 0, 0];

const _armOffset = new Vector3();
const _tiltEuler = new Euler();

/**
 * Recompute the tilt, the Sun's arm radius and the galaxy centre from `GALAXY`
 * (inclination, roll, disc radius), in place — so a live change of the pose keeps the
 * Sun in its arm. Called once at load, and by the tuning panel.
 */
export function updateGalaxyPlacement() {
  GALAXY_PLACEMENT.sunArmRadius = GALAXY.discRadius * GALAXY_SCALE * GALAXY_SOLAR_R;
  GALAXY_TILT[0] = (Math.PI / 180) * (90 - GALAXY.inclination);
  GALAXY_TILT[1] = 0;
  GALAXY_TILT[2] = (Math.PI / 180) * GALAXY.roll;
  _armOffset
    .set(GALAXY_PLACEMENT.sunArmRadius, 0, 0)
    .applyEuler(_tiltEuler.set(GALAXY_TILT[0], GALAXY_TILT[1], GALAXY_TILT[2]));
  GALAXY_CENTER[0] = SUNPOS[0] - _armOffset.x;
  GALAXY_CENTER[1] = SUNPOS[1] - _armOffset.y;
  GALAXY_CENTER[2] = SUNPOS[2] - _armOffset.z;
}
updateGalaxyPlacement();

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
  dEnd: RMAX_WORLD * (19.3 / 10.5), // ≈ 1042 — the study's framing distance, scaled (sets the zoom's pace)
  // The full view is this much CLOSER than the study's framing, so the galaxy fills ~10%
  // more of the frame (the camera ends at dEnd / endCloser ≈ 947). Built up over the
  // flight out to the galaxy only, so the solar-system framing is unchanged.
  endCloser: 1.1,
  // Once the galaxy has landed, the camera DRIFTS gently back over the pause before the
  // Contact form (JOURNEY galaxyEnd → contactStart), eased, until the galaxy is this much
  // smaller on screen — the form comes in as it settles.
  driftBack: 0.02,
  endDir: [0, 3.2, 19] as [number, number, number], // study camera dir (upright, slightly above)
  curve: 1.0, // accel curve on the eased look/dir lerp (1 = smoothstep)
  // The camera's AIM pans in two legs: Voyager → the (flying) Sun — framing the whole
  // real solar system — over [0, panSunEnd], then Sun → the galaxy centre over
  // [panSunEnd, 1]. Anchored on the LIVE Sun position, so scrolling back zooms into
  // the solar system wherever it has flown to in the galaxy.
  panSunEnd: 0.44,
} as const;
