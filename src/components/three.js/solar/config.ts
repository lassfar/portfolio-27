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

// ── Reveal + look ────────────────────────────────────────────────────────────

export const SOLAR = {
  revealStart: 0.05, // voyage progress where the system begins to fade in
  revealEnd: 0.5, // fully faded in here (the camera keeps pulling back after)

  // A single directional light in VIEW space (like the Saturn) so each planet
  // keeps a lit + a shadowed side.
  light: {
    dir: [-0.5, 0.45, 0.8] as [number, number, number],
    ambient: 0.22,
  },

  // Faint orbit guide-rings.
  ring: {
    color: "#5f6f92", // muted blue-grey
    opacity: 0.16,
    segments: 200,
  },

  // Mild dot-thinning of the far siblings as the camera pulls back.
  planetThinMax: 0.35,
} as const;

// ── The sun ──────────────────────────────────────────────────────────────────

export const SUN = {
  radius: 3.4,
  count: 30000, // desktop particle count — dense so the dots fuse into a solid, THICK disc
  countMobile: 11000,
  size: 40, // base point size — big enough that grains overlap into a solid disc
  spin: 0.04, // slow self-rotation (rad/sec)

  // Fiery gradient: bright core → orange → deep red-orange limb, like the sun
  // reference. The corona/gas beyond the surface fades to a faint deep red.
  core: "#fff2d4", // bright warm-white center
  mid: "#ff9a2e", // orange
  edge: "#e8461c", // deep red-orange limb
  corona: "#c23210", // faint red corona / gas beyond the surface

  // Living, boiling surface (GPU shader).
  granulation: 2, // simplex-noise frequency for the boiling surface
  flowSpeed: 0.22, // how fast the surface churns
  surfaceBoil: 0.012, // normal displacement of the surface — SMALL, so the sphere shape holds (life is mostly brightness)
  coronaDrift: 0.14, // outward wispy drift of the OUTER EDGE gas — kept low so the rim lives gently
  coronaFlicker: 0.24, // brightness flicker of the outer edge (lower = calmer)
  fill: 1, // how far in from the limb the dense body reaches (0..1) — bigger = thicker/fuller
  coronaFraction: 0.1, // share of particles forming the tight outer gas rim (lower = more on the dense body)
  coronaReach: 0.28, // how far the corona extends beyond the surface (× radius)
  glowSize: 2.6, // soft glow-halo diameter as a multiple of the radius — kept tight so it hugs the sun
} as const;

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
  {
    id: "earth",
    radius: 10,
    size: 0.55,
    color: "#4d8ac9",
    count: 2600,
    orbitSpeed: 0.108,
    spin: 0.6,
    phase: 4.1,
    highlight: true,
  },
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
