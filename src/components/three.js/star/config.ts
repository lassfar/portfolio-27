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
  // The debris fades out between these distances from the camera (world units) as it
  // flies past (P27-78): up close each dot would grow to ~140 px and cost the most.
  nearFade: [0.4, 1.2],
} as const;

/** Mutable: the dev panel (`?gui` → ✧ Stars) tunes it live. */
export const STARFIELD = {
  count: 2600,
  minRadius: 11,
  radiusSpread: 24, // particles sit between minRadius and minRadius + radiusSpread
  size: 22, // base point size (shader px, distance-attenuated)
  brightFraction: 0.08, // share of rare, larger "standout" stars
  brightSize: 3.2, // extra size multiplier applied to the standouts
  twinkleSpeed: 0.7, // gentle brightness-shimmer speed (SIZE is never twinkled → no flicker)
  twinkleAmount: 0.3, // 0..1 depth of the shimmer (kept low)
  // Realistic stellar tints (hot blue-white → white → gold → amber), weighted
  // toward white so the field reads as a real night sky, not a rainbow.
  tints: ["#cfe0ff", "#eaf1ff", "#ffffff", "#fff4e6", "#ffe6c2", "#ffd9a8"],
  tintWeights: [0.1, 0.2, 0.3, 0.2, 0.12, 0.08],
  // The brightest standouts sparkle like stars in a space photo — the galaxy finale's
  // own sparkle (GALAXY_FX.sparkles: sharp core, soft halo, hairline 4-ray cross),
  // drawn smaller. Widths are in screen px (smooth profiles, so they never flicker).
  sparkle: {
    share: 1, // share of the standouts that sparkle (the brightest first) — 1 = all of them (≈8% of the field)
    size: 23, // sprite px for the biggest (smallest: 45% of it) — the rays' reach; the galaxy's is 62 (×0.45–1.35)
    spikes: 0.2, // ray strength (the galaxy's is 1.15)
    rayWidth: 0.2, // ray thickness (px)
    coreSize: 0.45, // bright centre (px)
    halo: 0, // soft glow around the centre (0 = none; the galaxy's is 0.35)
    haloSize: 0.5, // its reach (px)
    pulseSpeed: 0, // brightness pulse speed (rad/s) — still
    pulseAmount: 0, // its depth — none
  },
};

// ── Deep-space haze (faint nebula / dust backdrop) ───────────────────────────

export const HAZE = {
  radius: 46, // large shell enclosing the whole scene, behind the stars
  intensity: 0.08, // very faint — subtle atmosphere, not a loud sci-fi nebula
  scale: 2.2, // noise frequency (larger = smaller cloud patches)
  drift: 0.01, // slow churn speed
  colorA: "#26375e", // faint cool blue
  colorB: "#3a2b2b", // faint warm dust
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
/**
 * The galaxy finale's PACING, in scroll % (see JOURNEY.galaxyPace / galaxy/pace.ts):
 *   1. pull back out from the Parker Solar Probe to the whole solar system (`toSolar`),
 *      at an even pace here — the camera's distance follows the story's standard curve
 *      (slow off the probe → fast through the empty stretch → slow onto the system);
 *   2. hold there (`solarHold` = PAUSES.wayOut) — the planets keep orbiting;
 *   3. fly out to the galaxy (`toGalaxy`) on the story's standard curve, GLIDING TO
 *      REST on the full view.
 * Everything in the finale is keyed to the galaxy progress, so the fades stay in step
 * with the camera. (The Earth / Voyager arrivals work the same way.)
 */
/**
 * The story's PAUSES: how long each rest holds, in scroll % (P27-77: ~100% each; the
 * full galaxy's drift before Contact is shorter). Change a number here and the whole
 * scroll map (SCROLL, below) shifts after it; the timeline, the story title and the
 * navigation assistant all follow.
 */
const PAUSES = {
  saturn: 100, // Saturn built, before the About text slides in
  constellation: 100, // the Craft's constellation, assembled
  earth: 100, // the Earth up close
  probe: 100, // the Parker Solar Probe's close-up
  wayOut: 100, // the whole solar system, before the flight to the galaxy
  galaxy: 80, // the full galaxy (the camera drifts gently back) before Contact
  contact: 50, // the Contact form, to the end
};

/** One length for the story's camera flights (scroll %, P27-77): the fly-out, the dive, the pull-out. */
const FLIGHT = 700;

/** The flight out to the Milky Way: longer than FLIGHT, an exception for its long, slow landing. */
const GALAXY_FLIGHT_LENGTH = 900;

const GALAXY_PACE = { toSolar: FLIGHT, solarHold: PAUSES.wayOut, toGalaxy: GALAXY_FLIGHT_LENGTH };

/** The Lab's trip, from leaving the Earth to arriving at the probe (scroll %), before its pause. */
const LAB_TRIP = 1260;

/**
 * Where each beat sits on the one pin, in ABSOLUTE scroll (% of the viewport height),
 * built in order from each beat's length and the PAUSES, so lengthening one moves only
 * what comes after it. The pin's fractions (mp, below) are derived from these.
 */
const SCROLL = (() => {
  const starEnd = 220; // the star plays, bursts, and its debris flies through
  const assembleStart = 200; // Saturn assembles (overlapping the burst)…
  const assembleEnd = 460; // …built
  const contentExit = 81; // the hero copy lifts away over the first ~81%
  const revealStart = assembleEnd + PAUSES.saturn; // the About text slides in…
  const fillStart = revealStart + 50; // …its words colour in…
  const exitStart = fillStart + 320; // …and it exits
  const journeyEnd = exitStart + 150; // the star → Saturn → About block ends
  const craftCoverStart = exitStart - 2; // the Craft slides up as the Maker exits…
  const constellationEnd = journeyEnd + 320; // …covering by journeyEnd; its constellation assembles
  const craftFadeStart = constellationEnd + PAUSES.constellation;
  const craftFadeEnd = craftFadeStart + 91.5; // = the Saturn's fly-away / voyage start
  const voyageEnd = craftFadeEnd + 2 * FLIGHT; // the fly-out + the dive (VOYAGE.flyoutEnd 0.5): the Earth has fully arrived
  const earthDwellEnd = voyageEnd + PAUSES.earth;
  const galaxyStart = earthDwellEnd + LAB_TRIP + PAUSES.probe; // the Lab: the trip + the close-up
  const galaxyEnd =
    galaxyStart + GALAXY_PACE.toSolar + GALAXY_PACE.solarHold + GALAXY_PACE.toGalaxy;
  const contactStart = galaxyEnd + PAUSES.galaxy;
  const contactEnd = contactStart + 160; // the form reveal
  const pinEnd = contactEnd + PAUSES.contact;
  return {
    starEnd,
    assembleStart,
    assembleEnd,
    contentExit,
    revealStart,
    fillStart,
    exitStart,
    journeyEnd,
    craftCoverStart,
    constellationEnd,
    craftFadeStart,
    craftFadeEnd,
    voyageEnd,
    earthDwellEnd,
    galaxyStart,
    galaxyEnd,
    contactStart,
    contactEnd,
    pinEnd,
  };
})();
/** Master-progress fraction (mp) of an absolute scroll position (% of the viewport height). */
export const mpAt = (pct: number) => pct / SCROLL.pinEnd;
/**
 * The Lab's progress (useLabScroll, 0..1) at an absolute scroll % into the Lab: its
 * timings are set in scroll %, so the trip keeps its length whatever its pause.
 */
export const labAt = (pct: number) => pct / (SCROLL.galaxyStart - SCROLL.earthDwellEnd);
/** The journey block's progress (jp) at an absolute scroll %. */
const jpAt = (pct: number) => pct / SCROLL.journeyEnd;

export const JOURNEY = {
  // ── Pin length + the two coordinate spaces ──────────────────────────────────
  //
  // ONE pinned ScrollTrigger holds the shared cosmos on-screen for the WHOLE
  // story, so the Saturn can be revealed after the Craft and fly away in the same
  // scene. Two progress spaces live on this pin:
  //   • mp  (master progress, 0..1 over the whole pin) — the tail phases below.
  //   • jp  (journey progress, mp / journeyEnd, 0..1) — the star→Saturn→About
  //         block. Its internal thresholds (starSpan…exitStart) are jp-fractions,
  //         derived from their absolute places in SCROLL.
  pinLength: `+=${SCROLL.pinEnd}%`, // journey + Craft + voyage + Earth dwell + Lab + Galaxy finale + Contact
  // The star→Saturn→About journey occupies mp 0..journeyEnd (≈1010% of scroll);
  // the tail (journeyEnd..1) is the Craft, the voyage (fly-out + solar reveal + Earth
  // dive), the Earth DWELL, the Lab (Voyager), then the GALAXY finale (pull back from
  // Voyager → fly through stars → the galaxy resolves), then the CONTACT form over the
  // blurred galaxy. All the mp thresholds come from `SCROLL` (absolute positions).
  journeyEnd: mpAt(SCROLL.journeyEnd),
  starSpan: jpAt(SCROLL.starEnd), // star plays over 0..starSpan of the JOURNEY (jp), not the pin
  assembleStart: jpAt(SCROLL.assembleStart), // Saturn assembles over assembleStart..assembleEnd (overlaps the burst)
  assembleEnd: jpAt(SCROLL.assembleEnd), // Saturn fully built by here — ≈260% of scroll to build
  contentExit: jpAt(SCROLL.contentExit), // fraction of the journey over which the hero copy lifts away

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
  // finished planet just rests before the reveal (PAUSES.saturn).
  revealStart: jpAt(SCROLL.revealStart), // journey progress where the blur + text slide-in begins
  revealBlur: 64, // px of blur on the cosmos (matches Tailwind blur-3xl)
  revealDim: 0.6, // brightness multiplier on the cosmos (slight dim)

  // After the gray text has slid in, the letters colour in (gray → white, the
  // title to its own colours) as you keep scrolling — over fillStart..1.
  fillStart: jpAt(SCROLL.fillStart), // journey progress where the per-letter/word colour fill begins (≈320% of scroll → slower fill)

  // After the fill, the About block exits (slides up + fades + blurs out) while
  // the cosmos un-blurs back to the sharp Saturn — then the pin releases.
  exitStart: jpAt(SCROLL.exitStart), // journey progress where the About exit begins (fill ends here)

  // ── Tail phases (MASTER-progress fractions, mp — NOT jp) ─────────────────────
  //
  // The Craft slides up to COVER the Saturn AS the Maker (About) exits — the two
  // sections hand straight over with no bare-Saturn beat between them. Its
  // constellation then assembles, it fades out to reveal the Saturn again, and the
  // Saturn flies away. All within the same pin, so the cosmos never unpins → no
  // boundary jump, and reverse mirrors exactly.
  craftCoverStart: mpAt(SCROLL.craftCoverStart), // Craft begins sliding up AS the Maker exits
  craftCoverEnd: mpAt(SCROLL.journeyEnd), // …fully covering by the time the Maker has exited (= journeyEnd) → no Saturn shown between
  constellationEnd: mpAt(SCROLL.constellationEnd), // constellation assembles over craftCoverEnd..constellationEnd
  craftFadeStart: mpAt(SCROLL.craftFadeStart), // brief hold, then Craft fades out (opacity 1→0)…
  craftFadeEnd: mpAt(SCROLL.craftFadeEnd), // …fully gone here → the Saturn is revealed behind it
  flyAwayStart: mpAt(SCROLL.craftFadeEnd), // where the Saturn is revealed and the voyage begins (voyage = 0)
  // ── The voyage → the Earth DWELL → the Lab ───────────────────────────────────
  // useVoyageScroll = remap01(mp, flyAwayStart, voyageEnd) → reaches 1 as the Earth
  // arrives (the camera glides to REST — see the Earth dive in CosmicScene) and
  // clamps at 1 through the dwell AND the Lab, so the Earth stays put behind Voyager.
  // The dwell [voyageEnd, earthDwellEnd] is a flat stretch (PAUSES.earth) where the
  // Earth simply holds fully in view (still idly self-spinning) before the Lab.
  // useLabScroll = remap01(mp, earthDwellEnd, galaxyStart): the Lab (Earth→Voyager) beat.
  voyageEnd: mpAt(SCROLL.voyageEnd), // Earth fully arrived (voyage = 1)
  earthDwellEnd: mpAt(SCROLL.earthDwellEnd), // Earth holds fully in view over voyageEnd..here, then the Lab begins
  // ── The Galaxy finale ────────────────────────────────────────────────────────
  // The Lab ends at galaxyStart (Voyager fully framed); from there the camera pulls
  // BACK and useGalaxyScroll (galaxy/pace.ts — eased, see galaxyPace) drives the
  // pull-back, the star-field fly-through, the galaxy's reveal, and the "You are here"
  // marker.
  galaxyStart: mpAt(SCROLL.galaxyStart), // Lab ends / galaxy pull-back begins (~1090% to galaxyEnd)
  galaxyEnd: mpAt(SCROLL.galaxyEnd), // the whole galaxy is in view (at rest)
  galaxyPace: GALAXY_PACE, // the finale's eased pacing (see GALAXY_PACE above)
  // ── Contact (the fullscreen form) ────────────────────────────────────────────
  // After PAUSES.galaxy on the full galaxy (time to take it in, while the camera drifts gently
  // back — GALAXY_ZOOM.driftBack), the form fades in
  // over it — like The Maker: the galaxy softens behind it, the title writes in, then
  // the fields rise in — over contactStart..contactEnd (~160%), then holds to the end.
  contactStart: mpAt(SCROLL.contactStart),
  contactEnd: mpAt(SCROLL.contactEnd),
  // The galaxy stays a recognisable soft BACKDROP behind the form: a light blur (a
  // heavy one, like The Maker's, averages its fine dots into a flat haze) and a mild
  // dim — done in WebGL (scene/VeilEffect); a soft vignette behind the form keeps the
  // text readable (Contact.tsx).
  contactBlur: 1.6, // how far the blur spreads behind the form (1 = the kernel's default)
  contactDim: 0.68, // brightness multiplier on the cosmos behind the form (screen values)
} as const;

/**
 * The scene behind the panel's full view (P27-80): blurred and dimmed like the Maker's
 * backdrop — in WebGL (scene/VeilEffect), eased in and out as the full view opens and
 * closes (the side panel leaves the scene as it is).
 */
export const PANEL_VEIL = {
  blur: 22, // CSS px of blur on the cosmos
  dim: 0.46, // brightness multiplier on the cosmos (screen values)
  damping: 0.1, // how quickly it eases toward veiled / clear (per frame at 60fps)
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
const VIEWPORT_WORLD_HEIGHT = 2 * CAMERA.z * Math.tan((CAMERA.fov * Math.PI) / 180 / 2);

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
