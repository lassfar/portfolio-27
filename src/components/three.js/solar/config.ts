import { PLANET, SATURN } from "#/components/three.js/planet/config";

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
 * Orbits are REAL (see orbits.ts): each planet's J2000 elements — its oval, its tilt,
 * its orientation — in LOCAL coordinates relative to the sun (the pivot of the whole
 * system group), with the ecliptic as the flat XZ plane and +Y as north. Like the
 * real ones, they turn counterclockwise seen from the north, the same way the sun and
 * planets spin. Distances are the real ones, compressed (see `orbitRadius`), in the
 * real order. The Saturn keeps a circle through the world origin — where the star
 * bursts and the Saturn assembles — and the whole system rotates with the SHARED
 * space rotation (useSceneRotation), so dragging turns the cosmos and the system
 * together. The cinematic FLATTENING comes from the CAMERA rising and pitching DOWN
 * over the fly-out (CameraRig), so the orbits read as ellipses.
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

/** The Saturn's orbit radius = its fixed distance from the sun (origin → sun). */
export const SATURN_ORBIT_RADIUS = Math.hypot(SUNPOS[0], SUNPOS[2]);

/** The orbital angle at which the Saturn sits on the origin (its fixed spot). */
export const SATURN_ORBIT_PHASE0 = Math.atan2(-SUNPOS[2], -SUNPOS[0]);

// ── Real orbits ──────────────────────────────────────────────────────────────

/**
 * A body's orbit: its real Keplerian elements at J2000 (JPL's approximate elements,
 * Standish) — the distance in AU, the angles in degrees. `L0` + `rate` give its mean
 * longitude on any date, so the planets start where they really are today.
 */
export type OrbitElements = {
  au: number; // semi-major axis
  e: number; // eccentricity
  i: number; // inclination to the ecliptic
  node: number; // longitude of the ascending node (Ω)
  peri: number; // longitude of perihelion (ϖ)
  L0: number; // mean longitude at J2000
  rate: number; // mean longitude rate (°/century)
};

/**
 * The Saturn's real elements. Its orbit stays the fixed circle through the world
 * origin (the About planet's anchor), so only its distance and today's position are
 * used: the whole system is turned so its real position today lands on that spot.
 */
export const SATURN_ELEMENTS: OrbitElements = {
  au: 9.53668, e: 0.05386, i: 2.48599, node: 113.66242, peri: 92.59888, L0: 49.95424, rate: 1222.49362,
};

/** The Earth's real elements — the 3rd planet, between Venus and Mars. */
export const EARTH_ELEMENTS: OrbitElements = {
  au: 1.00000261, e: 0.01671, i: 0, node: 0, peri: 102.93768, L0: 100.46457, rate: 35999.37245,
};

/**
 * The system's pacing. Real distances and periods can't be shown as they are (a
 * real Sun would swallow the inner orbits; Mercury would lap Neptune ~700 times), so:
 *   • distances are the real ones raised to `compression`, anchored so the Saturn
 *     sits on its fixed orbit — the order and the "tight inner system, wide outer
 *     one" stay true;
 *   • orbits follow Kepler's third law on those distances, paced by the Earth;
 *   • spins follow the real day lengths, paced by one Earth day;
 *   • the moons' periods are real, each system on its own pace.
 * Mutable: the dev panel tunes it.
 */
export const SOLAR_MOTION = {
  compression: 0.38, // 1 = true distance ratios; lower = squeezed toward the Saturn's orbit
  orbitPace: 0.05, // the Earth's orbital speed (rad/s) — Kepler's law sets the others
  dayPace: 0.06, // one Earth day's self-spin (rad/s) — the day lengths set the others
  moonSecondsPerDay: 3.3, // the Moon's 27-day month plays in ~90 s
  jupiterMoonSecondsPerDay: 7, // Io circles Jupiter in ~12 s, Callisto in ~2 min
};

/** A body's orbit radius (world units) from its real distance (AU). */
export function orbitRadius(au: number): number {
  return SATURN_ORBIT_RADIUS * Math.pow(au / SATURN_ELEMENTS.au, SOLAR_MOTION.compression);
}

/** The mean motion (rad/s) on an orbit of radius `r` — Kepler's third law, paced by the Earth. */
export function keplerRate(r: number): number {
  return SOLAR_MOTION.orbitPace * Math.pow(orbitRadius(EARTH_ELEMENTS.au) / r, 1.5);
}

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

  // Faint orbit guide-rings.
  ring: {
    visible: true, // show the planets' orbit lines (the Earth's included)
    color: "#ffffff",
    opacity: 0.02, // barely there
    segments: 200,
  },
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
// The About-Saturn is this system's Saturn, so it's NOT in this list.

/**
 * Planet sizes use REAL ratios, anchored on the About Saturn: its world radius
 * (PLANET.radius × SATURN.scale = 1.5) is 9.45 Earth radii, so one Earth radius is
 * ≈ 0.159 world units. The rocky planets (the Earth included) are specks in the wide
 * view and Jupiter outsizes the Saturn, as in reality. The Sun is the one exception
 * (a real one would swallow the inner orbits); the distances are compressed too
 * (see SOLAR_MOTION).
 */
export const EARTH_RADIUS = (PLANET.radius * SATURN.scale) / 9.45;

/**
 * The sibling planets' shared dot style (the Saturn / Earth dot) and light. They're
 * lit by the actual Sun, so each keeps a day side facing it and a dim night side.
 * Mutable: the dev panel tunes it live.
 */
export const PLANET_STYLE = {
  dotSoftness: 0.13, // 0.02 = crisp → 0.5 = soft (the Saturn's)
  rimStart: 1, // the Saturn's grainy edge: where the rim starts to dissolve (1 = off)
  rimScatter: 0.12, // …and how far rim dots drift outward (× radius)
  shellJitter: 0, // radial grain of the dot shell (× radius)
  ambient: 0.27, // how visible the night side stays (≈ the Saturn's 0.26)
  // A solid core just under the dots: planets are solid, so the Sun, stars and orbit
  // lines behind one don't show through the gaps between its dots. Black by default;
  // coreTint can blend it toward the body's main colour (lit by the Sun like the dots).
  core: true,
  coreTint: 0.09, // 0 = coreColor (black), 1 = the body's main colour
  coreColor: "#19191C", // --color-rich-black, like the space around them
  coreShade: 0.7, // its brightness next to the dots (0 = black)
  // Dot-thinning as the camera pulls back (the share of dots dropped by the end of the
  // voyage). Off: with their real surfaces, dropped dots read as dark holes.
  thin: 0,
};

/**
 * Level of detail for the planets and moons (DottedBody). Every body's dots are the
 * same REAL size — the Saturn's — so a big planet is made of many dots and a small one
 * of few, and at the same distance all their dots look alike. Each frame a body draws
 * just enough of them to cover its disc at that dot size:
 *   • far, where real dots would shrink below `minDotPx`, they stay at that size and
 *     pack closer (up to `farCoverage`), so a small disc still reads round and solid;
 *   • up close, a dot is never bigger than `maxDotRel` of the body's on-screen
 *     diameter, so small bodies (Mercury, the moons) stay finely dotted too;
 *   • past its budget (`count`), the dots grow so it stays covered.
 * Dots entering or leaving fade. Mutable: the dev panel tunes it.
 */
export const PLANET_LOD = {
  dotWorld: 7, // real dot size: px at 1 unit away (the Saturn's is 10 — these are a bit finer)
  minDotPx: 0.95, // never smaller than this on screen (CSS px)
  maxDotRel: 0.004, // never bigger than this share of the body's on-screen diameter
  coverage: 1.39, // how much of the disc the dots cover up close (the Saturn's is ~0.54)
  farPack: 1.3, // how fast they pack closer once held at minDotPx…
  farCoverage: 6.95, // …up to this coverage (a far disc ~96–98% filled)
  minDots: 190, // even a speck keeps this many (so it reads solid)
  fadeBand: 0.13, // share of the drawn dots that fade in / out at the edge of the count
};

/**
 * The big planets (those with `saturnLook`: Jupiter, Uranus, Neptune) take the
 * Saturn's dots — its size and softness, with a subtler grainy edge — and a light
 * dust: a faint haze of grains floating just above the surface. (They keep
 * PLANET_LOD's denser coverage, so fewer dark gaps than the Saturn.) Mutable: the dev
 * panel tunes it.
 */
export const SATURN_LOOK = {
  dotWorld: PLANET.size, // the Saturn's dot size (10)
  dotSoftness: 0.38, // the Saturn's soft dots
  rimStart: 0.73, // a grainy edge, a little subtler than the Saturn's (0.5)…
  rimScatter: 0.025,
  shellJitter: 0, // a smooth shell
  dust: 0.06, // share of the dots that float as dust
  dustReach: 0.15, // how far above the surface (× radius)
  dustOpacity: 0.55, // how faint
  dustBreath: 0, // how much it drifts in and out (× radius) — still
};


/**
 * A planet's surface, drawn by one shared shader (planetShaders.ts). Every feature is
 * noise on the body's own frame, so it turns with the planet; 0 switches it off.
 */
export type PlanetLook = {
  base: string; // main colour (the mid tone of gradient belts)
  deep: string; // the darkest tone of gradient belts
  dark: string; // belts / dark regions / craters
  light: string; // zones / polar caps / cloud streaks
  accent: string; // lighter or dusty patches
  bands: number; // how many latitude belts (frequency)
  gradient: boolean; // belts as the Saturn's gradient (deep → dark → mid → light), not two-tone
  bandContrast: number; // 0..1 — belts vs zones
  bandWarp: number; // turbulence of the belt edges
  flow: number; // how fast the belts, clouds and storm drift
  mottle: number; // 0..1 — dark regions / craters
  mottleScale: number; // their size (higher = smaller)
  accentPatches: number; // 0..1 — lighter / dusty patches
  caps: number; // polar caps from this |sin latitude| (0 = none)
  clouds: number; // 0..1 — thin bright streaks
  haze: number; // 0..1 — a veil that softens every feature
  spot: { lat: number; lon: number; size: number; aspect: number; strength: number; color: string }; // one oval storm (degrees; strength 0 = none)
};

const NO_SPOT = { lat: 0, lon: 0, size: 0.1, aspect: 1.5, strength: 0, color: "#000000" };

export type PlanetDef = {
  id: string;
  orbit: OrbitElements; // its real orbit (see orbits.ts)
  size: number; // body radius (world units — real ratios, see EARTH_RADIUS)
  tilt: number; // axial tilt (degrees, real)
  day: number; // sidereal day (Earth days, real) — its spin, via SOLAR_MOTION.dayPace
  saturnLook?: boolean; // the Saturn's dots + dust (SATURN_LOOK) — the big planets
  look: PlanetLook; // its real features (see planetShaders.ts)
  count: number; // the most dots it draws, up close (scaled down on mobile) — see PLANET_LOD
  highlight?: boolean; // subtly brighter (unused)
};

// The Saturn (the About planet, anchored at the origin) and the Earth (the voyage's
// destination, EARTH_ELEMENTS) are NOT in this list — each has its own component.
export const PLANETS: PlanetDef[] = [
  {
    id: "mercury",
    orbit: { au: 0.38710, e: 0.20564, i: 7.00498, node: 48.33077, peri: 77.45780, L0: 252.25032, rate: 149472.67411 },
    size: 0.383 * EARTH_RADIUS,
    tilt: 0.03,
    look: {
      // Grey, cratered rock: dark and bright crater mottling.
      base: "#8f8a85",
      deep: "#403d3a",
      dark: "#55514e",
      light: "#c9c4bd",
      accent: "#bdb6ad",
      bands: 0,
      gradient: false,
      bandContrast: 0,
      bandWarp: 0,
      flow: 0,
      mottle: 0.85,
      mottleScale: 4.5,
      accentPatches: 0.5,
      caps: 0,
      clouds: 0,
      haze: 0,
      spot: { ...NO_SPOT },
    },
    count: 100000, // the most it draws (up close); the LOD picks how many
    day: 58.646, // barely turns
  },
  {
    id: "venus",
    orbit: { au: 0.72334, e: 0.00678, i: 3.39468, node: 76.67984, peri: 131.60247, L0: 181.97910, rate: 58517.81539 },
    size: 0.949 * EARTH_RADIUS,
    tilt: 177.4, // upside down → it spins backwards
    look: {
      // A pale cream cloud deck with faint swirling bands.
      base: "#e3cf9e",
      deep: "#a8864d",
      dark: "#c4a063",
      light: "#f4e9c8",
      accent: "#f4e9c8",
      bands: 4,
      gradient: false,
      bandContrast: 0.3,
      bandWarp: 1.2,
      flow: 0.05,
      mottle: 0,
      mottleScale: 2,
      accentPatches: 0,
      caps: 0,
      clouds: 0.15,
      haze: 0.25,
      spot: { ...NO_SPOT },
    },
    count: 100000, // the most it draws (up close); the LOD picks how many
    day: 243.018, // barely turns (backwards — it's upside down)
  },
  // (The Earth — 3rd from the Sun — is the interactive dotted globe; see EARTH_ELEMENTS.)
  {
    id: "mars",
    orbit: { au: 1.52371, e: 0.09339, i: 1.84969, node: 49.55954, peri: -23.94363, L0: -4.55343, rate: 19140.30268 },
    size: 0.532 * EARTH_RADIUS,
    tilt: 25.2,
    look: {
      // Rust red, dark regions, dusty orange patches, white polar caps.
      base: "#c1502e",
      deep: "#4a1c0f",
      dark: "#6b2a17",
      light: "#f2ece4",
      accent: "#dc8a52",
      bands: 0,
      gradient: false,
      bandContrast: 0,
      bandWarp: 0,
      flow: 0,
      mottle: 0.85,
      mottleScale: 2.5,
      accentPatches: 0.45,
      caps: 0.88,
      clouds: 0,
      haze: 0,
      spot: { ...NO_SPOT },
    },
    count: 100000, // the most it draws (up close); the LOD picks how many
    day: 1.026,
  },
  {
    id: "jupiter",
    orbit: { au: 5.20289, e: 0.04839, i: 1.30440, node: 100.47391, peri: 14.72848, L0: 34.39644, rate: 3034.74613 },
    size: 11.21 * EARTH_RADIUS, // bigger than the Saturn, as in reality
    tilt: 3.1,
    look: {
      // Cream zones + orange-brown belts (the Saturn's gradient, in Jupiter's colours)
      // with turbulent edges, and the Great Red Spot.
      base: "#d8a066",
      deep: "#5e2f14",
      dark: "#b06a36",
      light: "#f4e4c8",
      accent: "#efe3cc",
      bands: 9,
      gradient: true, // the Saturn's gradient belts
      bandContrast: 1,
      bandWarp: 0.7,
      flow: 0.03,
      mottle: 0,
      mottleScale: 3,
      accentPatches: 0,
      caps: 0,
      clouds: 0.1,
      haze: 0,
      spot: { lat: -22, lon: 0, size: 7.5, aspect: 1.8, strength: 1, color: "#c0583a" },
    },
    count: 100000, // the most it draws (up close); the LOD picks how many
    day: 0.4135, // the fastest spin
    saturnLook: true,
  },
  {
    id: "uranus",
    orbit: { au: 19.18916, e: 0.04726, i: 0.77264, node: 74.01693, peri: 170.95428, L0: 313.23810, rate: 428.48203 },
    size: 4.01 * EARTH_RADIUS,
    tilt: 97.8, // rolls on its side
    look: {
      // Pale cyan, nearly featureless — only the faintest bands.
      base: "#9fd8df",
      deep: "#6aa9b5",
      dark: "#80bfc9",
      light: "#c9eef0",
      accent: "#c9eef0",
      bands: 3,
      gradient: true, // the Saturn's gradient belts
      bandContrast: 0.18,
      bandWarp: 0.3,
      flow: 0.02,
      mottle: 0,
      mottleScale: 2,
      accentPatches: 0,
      caps: 0,
      clouds: 0,
      haze: 0.4,
      spot: { ...NO_SPOT },
    },
    count: 100000, // the most it draws (up close); the LOD picks how many
    day: 0.7183, // on its side
    saturnLook: true,
  },
  {
    id: "neptune",
    orbit: { au: 30.06992, e: 0.00859, i: 1.77004, node: 131.78423, peri: 44.96476, L0: -55.12003, rate: 218.45945 },
    size: 3.88 * EARTH_RADIUS,
    tilt: 28.3,
    look: {
      // Deep blue, faint darker bands, white cloud streaks and the Great Dark Spot.
      base: "#3f66d0",
      deep: "#1d3585",
      dark: "#2b48a3",
      light: "#e8f0ff",
      accent: "#e8f0ff",
      bands: 5,
      gradient: true, // the Saturn's gradient belts
      bandContrast: 0.35,
      bandWarp: 0.5,
      flow: 0.04,
      mottle: 0,
      mottleScale: 2,
      accentPatches: 0,
      caps: 0,
      clouds: 0.45,
      haze: 0,
      spot: { lat: -20, lon: 40, size: 8.5, aspect: 1.5, strength: 1, color: "#1d2d73" },
    },
    count: 100000, // the most it draws (up close); the LOD picks how many
    day: 0.6713,
    saturnLook: true,
  },
];

/** Mobile particle counts are scaled by this. */
export const SOLAR_MOBILE_SCALE = 0.45;

// ── The moons ────────────────────────────────────────────────────────────────

/**
 * The major moons, drawn like the planets (dots, real features, lit by the Sun) and
 * tidally locked (the same face always toward their planet). Sizes are real (like
 * the planets'); distances are compressed so they stay close around their planet
 * (the real ones would cross other orbits). Periods are real, on each system's own
 * pace (SOLAR_MOTION), and each starts at today's real position (its mean longitude
 * `L0` at `epoch`, advancing `rate` °/day).
 */
export type MoonDef = {
  id: string;
  parent: "earth" | "jupiter";
  size: number; // body radius (world — real ratio)
  distance: number; // orbit radius around its planet (world — compressed)
  period: number; // orbital period (Earth days — real)
  incl: number; // orbit inclination (°) — the Moon's to the ecliptic; Jupiter's moons ride its equator
  node: number; // ascending node (°) at `epoch`
  nodeRate: number; // node drift (°/day)
  L0: number; // mean longitude (°) at `epoch`
  rate: number; // mean longitude rate (°/day)
  epoch: number; // Julian date
  look: PlanetLook;
  count: number; // the most dots it draws, up close (scaled down on mobile) — see PLANET_LOD
};

export const MOONS: MoonDef[] = [
  {
    // The Moon: grey, with the dark "seas" (maria) and bright highland patches.
    id: "moon",
    parent: "earth",
    size: 0.2727 * EARTH_RADIUS,
    distance: 12 * EARTH_RADIUS, // real: 60 Earth radii
    period: 27.3217,
    incl: 5.145,
    node: 125.04455,
    nodeRate: -0.0529539,
    L0: 218.31645,
    rate: 13.17639648,
    epoch: 2451545.0,
    look: {
      base: "#a8a39b",
      deep: "#46423e",
      dark: "#5e5a55",
      light: "#d4cfc6",
      accent: "#cfc9bf",
      bands: 0,
      gradient: false,
      bandContrast: 0,
      bandWarp: 0,
      flow: 0,
      mottle: 0.65,
      mottleScale: 2.2,
      accentPatches: 0.35,
      caps: 0,
      clouds: 0,
      haze: 0,
      spot: { ...NO_SPOT },
    },
    count: 60000, // the most it draws (up close); the LOD picks how many
  },
  // Jupiter's four big (Galilean) moons — in Jupiter's equatorial plane. Real
  // distances: 5.9 / 9.4 / 15 / 26 Jupiter radii. Mean longitudes: Meeus ch. 44.
  {
    // Io: sulphur yellow, dotted with dark volcanoes and orange-red patches.
    id: "io",
    parent: "jupiter",
    size: 0.2859 * EARTH_RADIUS,
    distance: 2.3,
    period: 1.769138,
    incl: 0,
    node: 0,
    nodeRate: 0,
    L0: 106.07719,
    rate: 203.48895579,
    epoch: 2443000.5,
    look: {
      base: "#e3cf6a",
      deep: "#6b4320",
      dark: "#8b5a2b",
      light: "#f5edb5",
      accent: "#d9793a",
      bands: 0,
      gradient: false,
      bandContrast: 0,
      bandWarp: 0,
      flow: 0,
      mottle: 0.5,
      mottleScale: 5,
      accentPatches: 0.45,
      caps: 0,
      clouds: 0,
      haze: 0,
      spot: { ...NO_SPOT },
    },
    count: 60000, // the most it draws (up close); the LOD picks how many
  },
  {
    // Europa: bright ice, crossed by brownish cracks.
    id: "europa",
    parent: "jupiter",
    size: 0.245 * EARTH_RADIUS,
    distance: 2.75,
    period: 3.551181,
    incl: 0,
    node: 0,
    nodeRate: 0,
    L0: 175.73161,
    rate: 101.374724735,
    epoch: 2443000.5,
    look: {
      base: "#dcd2bf",
      deep: "#7d5f44",
      dark: "#9c7b5a",
      light: "#f2ede3",
      accent: "#b98c6a",
      bands: 0,
      gradient: false,
      bandContrast: 0,
      bandWarp: 0,
      flow: 0,
      mottle: 0.35,
      mottleScale: 6,
      accentPatches: 0.25,
      caps: 0,
      clouds: 0,
      haze: 0,
      spot: { ...NO_SPOT },
    },
    count: 60000, // the most it draws (up close); the LOD picks how many
  },
  {
    // Ganymede (the largest moon): dark regions and bright grooved terrain.
    id: "ganymede",
    parent: "jupiter",
    size: 0.4135 * EARTH_RADIUS,
    distance: 3.3,
    period: 7.154553,
    incl: 0,
    node: 0,
    nodeRate: 0,
    L0: 120.55883,
    rate: 50.317609207,
    epoch: 2443000.5,
    look: {
      base: "#8e857a",
      deep: "#433c35",
      dark: "#5b534a",
      light: "#cdc5b8",
      accent: "#cdc5b8",
      bands: 0,
      gradient: false,
      bandContrast: 0,
      bandWarp: 0,
      flow: 0,
      mottle: 0.55,
      mottleScale: 2.8,
      accentPatches: 0.4,
      caps: 0,
      clouds: 0,
      haze: 0,
      spot: { ...NO_SPOT },
    },
    count: 60000, // the most it draws (up close); the LOD picks how many
  },
  {
    // Callisto: dark, ancient, peppered with bright craters.
    id: "callisto",
    parent: "jupiter",
    size: 0.3783 * EARTH_RADIUS,
    distance: 3.9,
    period: 16.689018,
    incl: 0,
    node: 0,
    nodeRate: 0,
    L0: 84.44459,
    rate: 21.571071177,
    epoch: 2443000.5,
    look: {
      base: "#5d554c",
      deep: "#2a2521",
      dark: "#3b3530",
      light: "#b9b1a4",
      accent: "#b9b1a4",
      bands: 0,
      gradient: false,
      bandContrast: 0,
      bandWarp: 0,
      flow: 0,
      mottle: 0.4,
      mottleScale: 4,
      accentPatches: 0.3,
      caps: 0,
      clouds: 0,
      haze: 0,
      spot: { ...NO_SPOT },
    },
    count: 60000, // the most it draws (up close); the LOD picks how many
  },
];

// ── The asteroid belt ────────────────────────────────────────────────────────

/**
 * The main asteroid belt between Mars and Jupiter — thousands of faint dots, each on
 * its own orbit: 2.1–3.3 AU (compressed like the planets) with the Kirkwood gaps
 * (cleared by Jupiter's resonances), a spread of tilts and ovals, each circling at
 * its own Kepler speed so the belt slowly shears. Mutable: the dev panel tunes it.
 */
export const ASTEROIDS = {
  show: true,
  count: 6000,
  countMobile: 2600,
  inner: 2.1, // AU
  outer: 3.3, // AU
  gaps: [2.5, 2.82, 2.95, 3.27], // the Kirkwood gaps (AU)
  gapWidth: 0.025, // AU
  incl: 4, // typical inclination (°) — a few reach ~15°
  ecc: 0.12, // largest eccentricity
  size: 0.9, // dot size (px) in the wide view
  maxSize: 3, // px cap up close (the dive can pass near the belt)
  brightness: 0.32, // faint: a hint of dust, never a ring that competes with the planets
  color: "#a39a8c",
};
