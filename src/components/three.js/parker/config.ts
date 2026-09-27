import { EARTH_RADIUS } from "#/components/three.js/solar/config";

/**
 * The Parker Solar Probe — launched 12 August 2018, the Lab's craft (it replaced
 * Voyager 1 in P27-72). Like the Voyager before it, it is a SOLID, lit craft — the
 * one human-made object among the particle-formed worlds.
 *
 * Built to its real proportions (NASA / JHU APL), in METRES, in a local frame where
 * +Y points at the Sun: the heat shield on top, the craft hanging in its shade.
 *   • Heat shield (TPS): Ø 2.3 m, 11.4 cm thick — white sun-facing coat, carbon core.
 *   • Bus: a hexagonal body ~1 m wide; cooling radiators just under the shield.
 *   • Solar arrays: two 1.1 × 0.7 m wings, swept back into the shade.
 *   • FIELDS: four 2 m niobium whip antennas in the shield's plane, out in the sunlight;
 *     a fifth short one across the magnetometer boom.
 *   • Magnetometer boom: 3.5 m, pointing away from the Sun, three fist-sized sensors.
 *   • SWEAP's Solar Probe Cup peeking over the shield's rim; WISPR (the camera) and
 *     IS☉IS (an octagonal dome) in the shade; a high-gain antenna dish.
 *   • The memory card — 1.1 million names, on a plaque dedicated to Eugene Parker,
 *     below the high-gain antenna. It anchors the Lab's label.
 *
 * It is drawn at its TRUE size (`METRE` scene units per metre — ~0.00000008 units for
 * its 3 m) on its real orbit (`orbit.ts`); see ParkerProbe for how a craft that small
 * is drawn, and the marker that stands in for it from afar.
 */
export const PARKER = {
  // The point on its axis (metres, +Y = sunward) that sits on its position — between
  // the shield and the bus, so it frames centred.
  pivotY: -1.0,
  // The bus face (angle from +Z toward +X, about its Sun axis) carrying the high-gain
  // antenna and the memory card — the side the Lab's close-up looks at.
  front: Math.PI / 6,

  shield: { radius: 1.15, thickness: 0.114, coat: 0.012 },
  truss: { top: 0.55, bottom: 0.36, radius: 0.018 }, // strut ring radii (m) + strut radius
  radiator: { width: 0.55, height: 0.5, depth: 0.03, at: 0.42, y: -0.36 },
  bus: { radius: 0.5, height: 1.0, top: -0.75 }, // hexagonal prism (circumradius)
  array: { length: 1.1, width: 0.7, depth: 0.03, sweep: 0.96, hingeY: -0.82 }, // sweep: radians below the shield plane
  whip: { length: 2.0, radius: 0.012, root: 0.9, y: -0.1, azimuth: Math.PI / 4 }, // first of 4, 90° apart
  cup: { radius: 0.07, height: 0.12 },
  boom: { length: 3.5, radius: 0.018, sensors: [1.6, 2.4, 3.5], shortAntennaAt: 3.08, shortAntenna: 0.21 },
  hga: { radius: 0.3, depth: 0.1 },
  card: { width: 0.24, height: 0.17, depth: 0.012 },

  // Realistic colours (NASA's own), with the memory card in the brand peach.
  colors: {
    shieldCoat: "#F2F2EE", // the white sun-facing coat
    carbon: "#2A2A2E", // the shield's carbon core + struts
    bus: "#1C1C20", // black thermal blankets
    array: "#1E2F55", // solar cells
    frame: "#A9AEB6", // array frames, booms
    niobium: "#C9CCD2", // the FIELDS whips
    light: "#D7D9DD", // radiators, dish, instruments
    card: "#FFA14A", // the memory card (brand peach)
    cardGlow: "#FFA14A",
  },
} as const;

/** Scene units per real metre — the scene's own scale (EARTH_RADIUS is the Earth's 6,371 km). */
export const METRE = EARTH_RADIUS / 6_371_000;

/**
 * Drawing a craft ~0.00000008 units across: each frame it's drawn along its true
 * direction from the camera, at `drawDistance` (when it's nearer than that), scaled up
 * by the same factor — identical on screen (same angle, same size) to the real 3 m
 * probe at its real distance, at a depth the camera renders. From afar, below
 * `modelMinPx`, a fixed-size glowing marker stands in for it.
 */
export const PARKER_VIEW = {
  drawDistance: 0.5, // scene units — well beyond the camera's near plane (0.1)
  modelMinPx: 1.2, // the model shows from this on-screen size (shield width, CSS px)
  markerPx: 7, // the marker's size (CSS px)
  markerFade: [1.5, 6] as [number, number], // it fades out as the model grows over these px
  markerColor: "#FFE3C7",
  sunlight: 2.2, // the Sun's light on the craft (a directional light from the Sun)
  // A soft fill from the camera's side, like a photographer's: seen from its shaded
  // side (the Sun behind it), the craft would otherwise be a black silhouette.
  fill: 1.3,
  fillColor: "#e8e4de",
  cardLabelPx: 60, // the memory-card label shows once the probe is this big on screen
} as const;

/**
 * The Lab's camera (CameraRig segment 3 + the start of the finale) — NASA "Eyes"
 * style, over the Lab's ~1400% of scroll (as long as Saturn → Earth). Lab progress:
 *   • pullBack: from the full Earth view, a steady zoom OUT (the reverse of the Earth
 *     arrival) to an overview of the inner solar system, angled from above (the voyage's
 *     wide view direction), the view turning from the Earth to the Sun — arriving
 *     still moving, straight into the zoom, like the Saturn fly-out into the Earth
 *     dive (no hold: the solar system is only still while the zoom eases in);
 *   • zoom: into the real-size probe, the distance eased in log space through `zoomKeys`
 *     (lab, distance): NORMAL speed while the scene is visible, FAST through the empty
 *     stretch (the probe under a pixel — only its tooltip), SLOW for the arrival — with
 *     the aim sliding from the Sun to the probe with the distance flown (like the Earth
 *     dive: no turn in place — the probe keeps its place on screen as the camera flies
 *     straight at it, and centres on arrival), the solar system fading to focus on the
 *     probe (`focus`, see PARKER_FOCUS), and a swing round to the 3/4 close-up side
 *     over the arrival (`swing`);
 *   • rest at the close-up (the memory-card label shows at LAB.recordLabelAt).
 */
export const PARKER_CAM = {
  distance: 9, // the close-up distance (METRES)
  side: 55 * (Math.PI / 180), // the close-up sits this far off the anti-Sun axis (3/4, the Sun behind)
  lift: 0.25, // …and a little above the orbit plane
  pullBack: [0, 0.3] as [number, number],
  // The pull-back's speed as it reaches the overview (× its average; 0 = glides to rest):
  // the pace the Saturn fly-out reaches the wide view at, relative to its distance.
  pullBackArrive: 0.1,
  overview: 22, // the overview's distance from the Sun (scene units) — frames the Earth's orbit
  // The zoom's distance to the probe (scene units): [lab, distance] keyframes, eased as one
  // smooth curve (monotone — velocity continuous, zero at both ends). null = from the
  // overview.
  zoomKeys: [
    [0.3, null],
    [0.56, 1.5], // normal speed while the solar system is on screen…
    [0.66, 2000 * (EARTH_RADIUS / 6_371_000)], // …fast through the empty stretch (2000 m: ~1 px)…
    [0.9, 9 * (EARTH_RADIUS / 6_371_000)], // …slow for the arrival (the close-up distance)
  ] as [number, number | null][],
  focus: [0.54, 0.64] as [number, number], // the solar system fades to focus on the probe
  swing: [0.72, 0.9] as [number, number], // lab progress over which it swings to the close-up side
  // The finale's pull back OUT (galaxy progress, its first leg — GALAXY_PACE.toSolar),
  // the zoom in reversed: the camera backs straight away from the probe toward the
  // finale's solar-system framing, its distance to the probe as [galaxy, distance]
  // keyframes, eased as one smooth curve — a SLOW departure (the swing away from the
  // close-up side over `pullOutSwing`), FAST through the empty stretch, NORMAL once the
  // solar system is back (null = at the framing, GALAXY_ZOOM.panSunEnd). The aim slides
  // from the probe to the Sun with the distance flown, as on the way in.
  pullOut: [
    [0, 9 * (EARTH_RADIUS / 6_371_000)],
    [0.13, 2000 * (EARTH_RADIUS / 6_371_000)],
    [0.18, 1.5],
    [0.44, null],
  ] as [number, number | null][],
  pullOutSwing: [0, 0.13] as [number, number],
  markerOut: [0.34, 0.44] as [number, number], // finale: the marker fades out over this galaxy progress
} as const;

/**
 * What fades as the Lab focuses on the probe (PARKER_CAM.focus) — toggled in the dev
 * panel (?gui → ✦ Parker) to compare. Mutable.
 */
export const PARKER_FOCUS = {
  fadeSun: true,
  fadeSystem: true, // the planets, moons, orbit lines, the asteroid belt and the Earth
};
