/**
 * Single source of truth for the Photography "worlds in orbit" scene.
 *
 * A solid, glowing Sun (the surviving core of the Hero's star = Aymane) sits at
 * the centre; the real planets orbit it on a near-top-down plane — each a HYBRID
 * world: a solid, procedurally shaded sphere (lit by the Sun) wrapped in a faint
 * particle atmosphere. Faint rings trace each orbit. Each planet later opens
 * (click) to reveal a photograph. Earth is present but reserved for a future
 * scenario (no photo yet). Palette mirrors the brand tokens.
 */

// ── Camera ───────────────────────────────────────────────────────────────────

export const CAMERA = {
  z: 14, // pulled back so the whole tilted orbit fits when viewed near top-down
  fov: 45,
  // Tight clip planes: everything sits ~8–20 units away, so hugging the near/far
  // planes to that range gives the depth buffer far more precision and kills the
  // z-fighting (every planet lies on its own coplanar orbit ring).
  near: 4,
  far: 36,
} as const;

// ── Sun (the surviving core) ─────────────────────────────────────────────────
// A solid, self-lit plasma sphere (the star = you) with a glowing corona.

export const SUN = {
  radius: 0.85,
  core: "#fff6df", // bright yellow-white centre
  mid: "#ffcf6e", // warm gold granulation
  edge: "#ff8a2a", // hot orange limb
  corona: "#ffb257", // additive glow halo around the disc
  turbulence: 0.55, // plasma cell contrast (shader-space)
  spinSpeed: 0.05, // radians/sec the surface churns/rotates
} as const;

// ── Motion ───────────────────────────────────────────────────────────────────

export const MOTION = {
  orbitSpeed: 0.06, // radians/sec the whole system revolves
  spinSpeed: 0.2, // radians/sec each planet self-rotates
  flowSpeed: 0.06, // gas-band drift speed
  orbitTilt: 1.1, // radians the orbit plane tilts (≈63° → near top-down)
} as const;

// ── Orbit paths ──────────────────────────────────────────────────────────────

export const ORBIT_PATH = {
  color: "#ffa14a", // faint peach ring drawn at each planet's orbit radius
  opacity: 0.14,
  width: 0.012, // ring thickness in world units
} as const;

// ── Planets ──────────────────────────────────────────────────────────────────

export type PlanetType = "rocky" | "gas" | "ice";

export type PlanetConfig = {
  id: string;
  name: string;
  type: PlanetType;
  radius: number; // sphere radius (all below the Sun's 0.62)
  orbit: number; // orbital distance from the Sun
  base: string; // mid surface colour
  dark: string; // shadow / low bands
  light: string; // highlight / high bands
  rings?: boolean;
  spot?: boolean; // a Jupiter-style storm spot
  reserved?: boolean; // present but no photo/open (Earth — future scenario)
  photo?: { title: string; grad: string }; // placeholder photograph
};

// Ordered outward from the Sun. Sizes are relative-but-scaled (Jupiter largest,
// still smaller than the Sun). Photo gradients are landscape-mood placeholders.
export const PLANETS: PlanetConfig[] = [
  {
    id: "mercury", name: "Mercury", type: "rocky", radius: 0.14, orbit: 1.55,
    base: "#8a8178", dark: "#48433d", light: "#c2bab0",
    photo: { title: "Golden hour", grad: "linear-gradient(165deg,#ffe6b0,#ef7d14 52%,#3a2140)" },
  },
  {
    id: "venus", name: "Venus", type: "rocky", radius: 0.22, orbit: 2.1,
    base: "#d8b878", dark: "#9a7c44", light: "#f2e6c0",
    photo: { title: "Dune", grad: "linear-gradient(165deg,#ffe3c7,#c98a4a 55%,#472e18)" },
  },
  {
    id: "earth", name: "Earth", type: "ice", radius: 0.24, orbit: 2.7,
    base: "#2f74b0", dark: "#183f72", light: "#7fbf78", reserved: true,
  },
  {
    id: "mars", name: "Mars", type: "rocky", radius: 0.18, orbit: 3.25,
    base: "#b0512f", dark: "#5e2a15", light: "#e0a070",
    photo: { title: "Ember sky", grad: "linear-gradient(165deg,#ffd0a0,#e24b4a 55%,#331318)" },
  },
  {
    id: "jupiter", name: "Jupiter", type: "gas", radius: 0.42, orbit: 3.95,
    base: "#c99a5e", dark: "#8a5a30", light: "#f0dcb0", spot: true,
    photo: { title: "Storm front", grad: "linear-gradient(165deg,#bcc6d4,#5b6b82 55%,#191f2c)" },
  },
  {
    id: "saturn", name: "Saturn", type: "gas", radius: 0.38, orbit: 4.65,
    base: "#d8c088", dark: "#a07840", light: "#f2e6c0", rings: true,
    photo: { title: "Horizon", grad: "linear-gradient(165deg,#ffe0b0,#ffa14a 42%,#2489ff 100%)" },
  },
  {
    id: "uranus", name: "Uranus", type: "ice", radius: 0.3, orbit: 5.25,
    base: "#8fd0d8", dark: "#4a8a92", light: "#c8f0f2",
    photo: { title: "Sea haze", grad: "linear-gradient(165deg,#e0f3f0,#5fa8b8 55%,#173038)" },
  },
  {
    id: "neptune", name: "Neptune", type: "ice", radius: 0.29, orbit: 5.8,
    base: "#3a6fc0", dark: "#21408a", light: "#7fb0e8",
    photo: { title: "Blue minute", grad: "linear-gradient(165deg,#cfe4ff,#2489ff 58%,#0a1830)" },
  },
];

/** Solid-shader surface type → int for the GLSL uType uniform. */
export const TYPE_INDEX: Record<PlanetType, number> = {
  rocky: 0,
  gas: 1,
  ice: 2,
} as const;
