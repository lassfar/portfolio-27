/**
 * The solar system the Saturn belongs to — the sun at the centre and the
 * planets on a near EDGE-ON, cinematic orbital plane (wide flattened ellipses
 * receding into depth, like a classic solar-system poster).
 *
 * As the CAMERA flies straight back from the Saturn (FLYOUT in the planet
 * config), the system opens up: the sun blazes at the centre, and the Saturn —
 * which starts at world origin (θ=0 of its own orbit, directly in front of the
 * sun) — ORBITS into its place, swinging aside to reveal the sun. So the Saturn
 * is a TRUE member on its own orbit, not a detached body.
 *
 * ── The plane ────────────────────────────────────────────────────────────────
 * Orbits are flat horizontal circles around the sun, in LOCAL coordinates
 * (relative to the sun, which is the pivot of the whole system group):
 *     localPos(r, φ) = (r·cosφ, 0, r·sinφ)
 * The system group sits at SUNPOS = (0,0,−Rsat), so the point (r = Rsat, φ = π/2)
 * lands exactly on the world origin — where the star bursts and the Saturn
 * assembles. Because everything is relative to the sun, the whole system rotates
 * with the SHARED space rotation (useSceneRotation) — dragging turns the cosmos
 * and the system together. The cinematic FLATTENING comes from the CAMERA rising
 * and pitching DOWN over the fly-out (CameraRig), so circles read as ellipses.
 */

// ── Geometry ─────────────────────────────────────────────────────────────────

/**
 * The sun sits OFF-AXIS (to the side + deep) so that the world ORIGIN — where the
 * Saturn is a fixed anchor — is the Saturn's real orbital slot (|SUNPOS| ≈ 22,
 * between Jupiter and Uranus). As the camera flies out and eases its look toward
 * the sun, the composition settles sun-centred with the fixed Saturn off to one
 * side. The sun is the pivot of the system group (drag/idle rotate around it).
 */
export const SUNPOS: [number, number, number] = [12, 0, -18];

/** LOCAL position (relative to the sun) of a body at orbit radius `r`, angle `φ`. */
export function orbitPosition(
  r: number,
  phi: number
): [number, number, number] {
  return [r * Math.cos(phi), 0, r * Math.sin(phi)];
}

/**
 * The Saturn "flies from the start": it glides along its orbit as a PURE function
 * of the voyage — no fixed phase, no placement transition, and it retraces to the
 * origin on reverse. Its orbit is defined to pass through the origin, so it begins
 * exactly there (at the About phase) and drifts along its orbit as you zoom out.
 */
export const SATURN_FLY = {
  // The Saturn orbits on its OWN (time-based) like a working member — scrolling
  // never moves it; the camera does all the scroll work (flies out from it).
  speed: 0.06, // continuous orbital speed (rad/sec)
} as const;

/** The Saturn's orbit radius = its fixed distance from the sun (origin → sun). */
export const SATURN_ORBIT_RADIUS = Math.hypot(SUNPOS[0], SUNPOS[2]);

/** The orbital angle at which the Saturn sits on the origin (its fixed spot). */
export const SATURN_ORBIT_PHASE0 = Math.atan2(-SUNPOS[2], -SUNPOS[0]);

// ── Voyage sub-phases (fractions of useVoyageScroll 0..1) ────────────────────
//
// The voyage splits in two: the camera flies out from the Saturn to the wide
// sun-centred view over [0, flyoutEnd], then dives onto the Earth over
// [flyoutEnd, 1] while the rest of the system fades out.
export const VOYAGE = {
  flyoutEnd: 0.5, // Saturn→wide fly-out completes; the Earth dive begins
  earthFadeStart: 0.55, // the sun + siblings + Saturn begin to fade as we dive
  earthFadeEnd: 0.85, // system fully gone → just the Earth + the starfield
} as const;

// ── Reveal + look ────────────────────────────────────────────────────────────

export const SOLAR = {
  revealStart: 0.05, // voyage progress where the system begins to fade in
  revealEnd: 0.5, // fully faded in here (the camera keeps pulling back after)

  // The galaxy FINALE re-reveals the whole system: after it faded out for the Earth
  // dive, it fades BACK in over this window (in `useGalaxyScroll` progress) as the
  // camera pulls back from the Voyager, so the real solar system is what we see
  // "fully visible" before it shrinks into the galaxy. See solar/reveal.ts.
  finaleReturn: [0.03, 0.22] as [number, number],
  // …and once the camera is far out (the system is only a few pixels wide), the
  // planets + orbit lines fade away over this window so their dark shaded dots don't
  // smudge the galaxy; the Sun stays as the "You are here" speck. Reverses on scroll-up.
  finaleFarFade: [0.72, 0.9] as [number, number],

  // A single directional light in VIEW space (like the Saturn) so each planet
  // keeps a lit + a shadowed side.
  light: {
    dir: [-0.5, 0.45, 0.8] as [number, number, number],
    ambient: 0.22,
  },

  // Faint orbit guide-rings.
  ring: {
    visible: true, // show the planets' orbit lines (the Earth's included)
    color: "#ffffff",
    opacity: 0.02, // barely there
    segments: 200,
  },

  // Mild dot-thinning of the far siblings as the camera pulls back.
  planetThinMax: 0.35,
};

// ── The sun ──────────────────────────────────────────────────────────────────

/**
 * The Sun — a see-through ball of tightly packed dots, with the original Sun's warm glow
 * inside it. The dots follow the Saturn / Earth dot style: scattered at
 * random over the sphere with a little radial grain, varied in size and brightness,
 * soft and round, shrinking with distance. They shimmer gently and drift slowly along
 * the surface (never leaving it). Coloured like the original Sun (warm white → orange →
 * deep red-orange from the centre of the disc to its edge); the far side shows dimmer
 * through the gaps. Mutable: the dev panel (SunGui) tunes it live. See Sun.tsx.
 */
export const SUN = {
  radius: 3.4,
  count: 7500, // dots scattered over the sphere
  countMobile: 7000,
  dotSize: 95, // base point size (distance-attenuated, like the Saturn / Earth dots)
  dotSoftness: 0.35, // how soft each dot's edge is (0.02 = crisp → 0.5 = a soft blur)
  brightness: 1.45, // overall brightness of the dots
  shellJitter: 0.02, // radial grain of the dot shell (× radius), like the Saturn / Earth
  spin: 0.04, // slow rotation (rad/s); the poles turn ~25% slower
  swirl: 0.006, // how far dots drift ALONG the surface (× radius) — they never leave it
  shimmer: 0.24, // how much each dot's brightness gently rises and falls
  shimmerSpeed: 0.5,

  // The original Sun's colours + gradient, across the disc as you see it: the centre →
  // (linear) → the middle colour at `gradientSplit` of the way out → the edge colour.
  core: "#fff2d4", // bright warm-white centre
  mid: "#ff9a2e", // orange
  edge: "#e8461c", // deep red-orange edge
  gradientSplit: 0.55,
  backDim: 0.35, // far-side dots, seen through the gaps
  paused: false, // freeze the Sun's motion (for tuning)
};

/**
 * The original Sun, kept inside and around the dotted shell (SunCore.tsx):
 *   • its BODY — a dense volume of dots filling the sphere (a real 3D glow, not a flat
 *     disc), bright warm-white at the centre → orange → deep red-orange toward the edge,
 *     slowly boiling; it sits just inside the shell and shows through its gaps;
 *   • its CORONA — living dots drifting in a loose cloud just outside the sphere,
 *     wisping gently in and out and flickering, orange → deep red;
 *   • its soft warm HALO (glow sprite) around it all.
 * Mutable: the dev panel (SunGui) tunes it live.
 */
export const SUN_CORE = {
  radiusScale: 0.96, // × SUN.radius — just inside the dotted shell
  count: 30000, // desktop particle count — dense so the dots fuse into a glowing volume
  countMobile: 11000,
  size: 40, // base point size
  spin: 0.04, // slow self-rotation (rad/sec)
  core: "#fff2d4", // bright warm-white center
  mid: "#ff9a2e", // orange
  edge: "#e8461c", // deep red-orange toward the edge
  gradientSplit: 0.55, // where the middle colour sits, centre (0) → edge (1)
  granulation: 2, // simplex-noise frequency of the boil
  flowSpeed: 0.22, // how fast it churns
  surfaceBoil: 0.012, // tiny inward dimple of the outer grains (the shape holds)
  fill: 1, // how far in from the edge the volume reaches (1 = all the way to the centre)
  // The corona: living dots drifting around the sphere (around the FULL-size shell).
  corona: "#c23210", // faint red corona / gas
  coronaFraction: 0.25, // share of the dots that form the corona cloud
  coronaReach: 0.19, // how far the cloud extends beyond the surface (× radius)
  coronaDrift: 0.63, // outward wispy drift in and out
  coronaFlicker: 0.75, // brightness flicker (lower = calmer)
  glowSize: 2.3, // soft halo diameter as a multiple of the radius
  haloTint: "#ffffff", // tints the halo's warm gradient (white = as is)
  // Strengths (0 hides a part).
  bodyStrength: 2,
  coronaStrength: 2,
  haloStrength: 2.05,
};

// ── The sibling planets (inner → outer) ──────────────────────────────────────
//
// The About-Saturn (Rsat = 30) is this system's Saturn, so it's NOT in this list.
// Sizes are hero-scale (all under the Saturn's ~1.5 world radius, Jupiter the
// largest sibling). Orbits are all < Rsat so they read as inner to the Saturn.

export type PlanetDef = {
  id: string;
  radius: number; // orbit radius (world units)
  size: number; // body radius
  color: string; // base tint
  count: number; // desktop particle count (scaled down on mobile)
  orbitSpeed: number; // orbital angular speed (rad/sec) — outer planets slower
  spin: number; // self-rotation speed (rad/sec)
  phase: number; // starting orbital angle (rad) — spreads them around the sun
  highlight?: boolean; // the one we fly to in M2 (subtly brighter)
};

// The Saturn (the fixed About planet at the origin, ~radius 22) is NOT in this
// list — it sits between Jupiter and Uranus. Siblings orbit the sun continuously.
export const PLANETS: PlanetDef[] = [
  {
    id: "mercury",
    radius: 4,
    size: 0.3,
    color: "#9b8a79",
    count: 1600,
    orbitSpeed: 0.17,
    spin: 0.4,
    phase: 0.5,
  },
  {
    id: "venus",
    radius: 7,
    size: 0.5,
    color: "#dcb884",
    count: 2400,
    orbitSpeed: 0.13,
    spin: 0.26,
    phase: 2.4,
  },
  // NOTE: Earth is NOT a sibling here — it's the voyage's destination, rendered
  // as the interactive dotted globe (see components/three.js/earth). It reveals
  // and fills the view during the Earth dive (VOYAGE.flyoutEnd..1).
  {
    id: "mars",
    radius: 13,
    size: 0.38,
    color: "#c85a38",
    count: 1900,
    orbitSpeed: 0.09,
    spin: 0.5,
    phase: 5.6,
  },
  {
    id: "jupiter",
    radius: 16,
    size: 1.1,
    color: "#c9a97c",
    count: 4200,
    orbitSpeed: 0.063,
    spin: 0.85,
    phase: 1.5,
  },
  {
    id: "uranus",
    radius: 27,
    size: 0.7,
    color: "#aadada",
    count: 2400,
    orbitSpeed: 0.041,
    spin: 0.5,
    phase: 3.5,
  },
  {
    id: "neptune",
    radius: 30,
    size: 0.68,
    color: "#4f6bc8",
    count: 2400,
    orbitSpeed: 0.03,
    spin: 0.5,
    phase: 0.2,
  },
];

/** Mobile particle counts are scaled by this. */
export const SOLAR_MOBILE_SCALE = 0.45;
