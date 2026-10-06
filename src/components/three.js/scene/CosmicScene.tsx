"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import {
  BlendFunction,
  BloomEffect,
  EffectComposer as EffectComposerImpl,
} from "postprocessing";
import { ReactNode, RefObject, useEffect, useMemo, useRef } from "react";
import { Euler, Group, PerspectiveCamera, Vector3 } from "three";
import Universe from "#/components/three.js/star/Universe";
import { BLOOM, CAMERA, JOURNEY, mpAt, PANEL_VEIL, PARTICLES } from "#/components/three.js/star/config";
import {
  clamp01,
  damp,
  easeInOutCubic,
  lerp,
  remap01,
} from "#/components/three.js/star/utils";
import Planet from "#/components/three.js/planet/Planet";
import {
  FLYOUT,
  PLANET,
  RING,
  SATURN,
} from "#/components/three.js/planet/config";
import SolarSystem from "#/components/three.js/solar/SolarSystem";
import {
  EARTH_ELEMENTS,
  EARTH_RADIUS,
  orbitPosition,
  orbitRadius,
  PLANETS,
  SATURN_ORBIT_RADIUS,
  SOLAR,
  SUNPOS,
  VOYAGE,
} from "#/components/three.js/solar/config";
import { orbitPositionAt, saturnAngle, systemTime } from "#/components/three.js/solar/orbits";
import { ORBIT_PRIORITY, planetInspect } from "#/components/three.js/solar/planetTuning";
import EarthMoon from "#/components/three.js/solar/EarthMoon";
import DottedEarth from "#/components/three.js/earth/DottedEarth";
import { EARTH_CAM } from "#/components/three.js/earth/config";
import ParkerProbe from "#/components/three.js/parker/ParkerProbe";
import ParkerJourney from "#/components/three.js/parker/ParkerJourney";
import { LAB_CAM } from "#/components/three.js/voyager/config";
import { parkerOffset } from "#/components/three.js/parker/orbit";
import { parkerViewDir } from "#/components/three.js/parker/pose";
import { METRE, PARKER_CAM } from "#/components/three.js/parker/config";
import Galaxy from "#/components/three.js/galaxy/Galaxy";
import GalaxyGui from "#/components/three.js/galaxy/GalaxyGui";
import PerfProbe from "./PerfProbe";
import {
  GALAXY,
  GALAXY_FX,
  GALAXY_SCALE,
  GALAXY_ZOOM,
} from "#/components/three.js/galaxy/config";
import { SoftHighlights, SoftHighlightsEffect } from "./SoftHighlights";
import { VeilEffect } from "./VeilEffect";
import { cosmicVeil } from "#/stores/cosmicVeil";
import { flyingSunPos, galaxyCenterPos } from "#/components/three.js/galaxy/spin";
import { frameGalaxy } from "#/components/three.js/galaxy/framing";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { useLabScroll } from "#/stores/useLabScroll";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useSceneRotation } from "#/stores/useSceneRotation";
import { useSaturnAnchor } from "#/stores/useSaturnAnchor";
import { useEarthAnchor } from "#/stores/useEarthAnchor";
import { useParkerAnchor } from "#/stores/useParkerAnchor";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { selectIsOpen, usePanelStore } from "#/stores/usePanelStore";
import { pinHover } from "#/components/three.js/earth/pinScreen";
import { storyEase } from "./storyMotion";
import { fitRamp, portraitFit, spanOf } from "./portraitFit";
import { monotoneCurve } from "./monotoneCurve";
import { onPerformanceChange, PERFORMANCE, PERFORMANCE_DEFAULTS } from "./performance";
import { precompile, setWarmUpTarget, whenIdle } from "./warmUp";
import { gpuClass, gpuRenderer, LOWEST_STEP, QUALITY_STEPS, startStep } from "./quality";
import { createQualityController, type QualityController } from "./qualityController";
import { recordQualityChange, recordQualityStart } from "./perfReport";
import { useQuality } from "#/stores/useQuality";
import { setScrollLock } from "#/stores/scrollLock";

/**
 * The unified cosmic scene: ONE Canvas holding the shared starfield, the Hero
 * star (ignite → zoom → explode, via `Universe`) and the About Saturn (built
 * from `Planet`), so the star's burst hands straight off into the planet
 * assembling out of the scattered debris.
 *
 * The star reads `useHeroScroll`, Saturn reads `useAboutScroll`; the Hero's one
 * pinned ScrollTrigger drives both. Saturn is centred where the star bursts and
 * scaled to the star camera. Bloom eases off as Saturn forms so the planet
 * stays crisp. Lazy-load with `next/dynamic({ ssr: false })`.
 */
const CosmicScene = () => {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = !prefersReduced;

  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const starCount = isSmall ? PARTICLES.countMobile : PARTICLES.count;
  const planetCount = isSmall ? PLANET.countMobile : PLANET.count;
  const ringCount = isSmall ? RING.countMobile : RING.count;

  const highlightsRef = useRef<SoftHighlightsEffect>(null);
  // The quality tiers lower the canvas's pixel ratio on slow GPUs (QualityMonitor). It
  // has to be the Canvas prop: R3F re-applies that prop whenever the Canvas renders.
  const maxDpr = useQuality((s) => QUALITY_STEPS[s.step].maxDpr);
  // The site bloom, created here and handed to the composer as-is (not through
  // @react-three/postprocessing's <Bloom>: that wrapper JSON-stringifies its props,
  // and under React 19 `ref` is a prop — once it holds the live effect, whose
  // resolution points back at it, every re-render threw "circular structure").
  // Same settings the wrapper applied (it forces the ADD blend).
  // Its intensity is 0 from the About section on (BloomController) — it then adds
  // nothing, yet its luminance pass + 8-level blur would still run every frame. So while
  // it's 0 those are skipped and it samples no texture — three's built-in blank one (no
  // stale glow left behind); the moment it's above 0 again (scrolling back up) it blurs
  // afresh before drawing.
  const bloom = useMemo(() => {
    const effect = new BloomEffect({
      blendFunction: BlendFunction.ADD,
      intensity: BLOOM.intensity,
      luminanceThreshold: BLOOM.threshold,
      luminanceSmoothing: BLOOM.smoothing,
      radius: BLOOM.radius,
      mipmapBlur: true,
    });
    const map = effect.uniforms.get("map");
    const update = effect.update.bind(effect);
    effect.update = (renderer, inputBuffer, deltaTime) => {
      const on = effect.intensity > 0;
      if (map) map.value = on ? effect.mipmapBlurPass.texture : null;
      if (on) update(renderer, inputBuffer, deltaTime);
    };
    return effect;
  }, []);
  useEffect(() => () => bloom.dispose(), [bloom]);
  // Blurs + dims the scene behind the Contact form (see VeilEffect).
  const veil = useMemo(() => new VeilEffect(), []);
  useEffect(() => () => veil.dispose(), [veil]);
  const composerRef = useRef<EffectComposerImpl>(null);
  // The starfield group — CameraRig pins it to the camera each frame (see below),
  // so it's shared between Universe (which rotates it) and CameraRig.
  const starfieldRef = useRef<Group>(null);

  return (
    <>
      <Canvas
        // far is large enough for the galaxy finale, where the camera pulls out to
        // ~1300 world units to frame the whole (scaled-up) spiral. near stays close
        // so the readable near-field beats (the Earth) keep their depth detail. (The
        // real-size Parker Solar Probe is drawn in scaled space — see ParkerProbe.)
        camera={{
          position: [0, 0, CAMERA.z],
          fov: CAMERA.fov,
          near: 0.1,
          far: 2800,
        }}
        dpr={[1, maxDpr]}
        // (No canvas antialiasing: only the composer's final full-screen pass reaches
        // the canvas; the composer smooths the scene itself, multisampled — see
        // Multisampling below.)
        gl={{ antialias: false, alpha: true }}
      >
        {/* Starfield + star: drag-rotates, scroll zooms + bursts the star. */}
        <Universe
          animate={animate}
          count={starCount}
          starfieldRef={starfieldRef}
        />

        {/* Saturn — this system's hero planet. It's a FIXED anchor at the origin
          while the camera zooms out from it; once the solar system is visible it
          FLIES (orbits the sun) like the others, starting from that spot. */}
        <SaturnMember>
          <Planet
            animate={animate}
            interactive={false}
            planetCount={planetCount}
            ringCount={ringCount}
          />
        </SaturnMember>

        {/* The solar system the Saturn belongs to — the sun at centre + the
          sibling planets on a near edge-on plane, revealed as the camera flies
          back, then faded out as we dive to Earth. */}
        <SolarSystem animate={animate} />

        {/* Earth — the voyage's destination, but a NORMAL orbiting member on its
          own place. It never grows/transitions; the camera flies to it (tracking
          its orbit) so it fills the view by perspective. */}
        <EarthMember>
          <DottedEarth animate={animate} />
          <EarthMoon animate={animate} />
        </EarthMember>

        {/* The Lab — the Parker Solar Probe (it replaced Voyager 1 in P27-72), at its
          real size on its real orbit. A SOLID, lit craft (the one man-made object among
          the particle worlds): a soft ambient + a cool fill here, and its own sunlight
          (a directional light from the Sun, in ParkerProbe). The camera flies from the
          Earth and dives to it (CameraRig segment 3). */}
        <ambientLight intensity={0.6} color="#50505a" />
        <directionalLight
          position={[5, -2, -4]}
          intensity={0.4}
          color="#9ec2ff"
        />
        <ParkerMember />
        <ParkerProbe />
        {/* Its journey since the 2018 launch, drawn as the Lab pulls back (P27-72). */}
        <ParkerJourney />

        {/* The Galaxy finale — ONE exponential pull-out (CameraRig segment 4). The
          camera backs off the Parker Solar Probe; the REAL solar system (Sun + planets, above)
          fades back in and frames up "fully visible", then shrinks as we keep flying
          out through the galaxy's own (fixed-size) stars until the whole brand-tinted
          spiral resolves around it. The galaxy is huge + world-fixed and centred so
          the real Sun sits in one of its arms — our "You are here". */}
        <Galaxy animate={animate} />

        {/* multisampling stays a constant: changing this prop would rebuild the
          composer (leaking its buffers); live changes go through Multisampling. */}
        <EffectComposer ref={composerRef} multisampling={PERFORMANCE_DEFAULTS.msaa}>
          {/* First, so the veil applies before the bloom + highlights in the one merged
            effect pass. */}
          <primitive object={veil} dispose={null} />
          <primitive object={bloom} dispose={null} />
          {/* The galaxy finale's camera-like highlight roll-off (strength ramped by
            BloomController, so it's off for every earlier beat). */}
          <SoftHighlights ref={highlightsRef} knee={GALAXY_FX.highlightKnee} />
        </EffectComposer>

        <BloomController bloom={bloom} veil={veil} highlightsRef={highlightsRef} />
        <Multisampling composerRef={composerRef} />
        <ComposerResize composerRef={composerRef} />
        <QualityMonitor />
        <ShaderWarmUp composerRef={composerRef} veil={veil} />
        <CameraRig starfieldRef={starfieldRef} />
        <InteractionLock />
        <RenderPause composerRef={composerRef} />
        {/* Dev-only (?perf / ?perf=overlay) — renders nothing otherwise. */}
        <PerfProbe />
      </Canvas>
      {/* Dev tuning panel for the galaxy finale (dev, or `?gui` in production). */}
      <GalaxyGui />
    </>
  );
};

export default CosmicScene;

/**
 * The Saturn is a working member: it orbits the sun on its OWN (time-based),
 * never moved by scroll. Its orbit passes through the world origin, so during the
 * intro (voyage 0) the system's clock (`systemTime`) is held at 0 → it sits at the
 * origin where the star bursts and assembles, and the camera is at the star distance
 * (untouched intro). Once the voyage begins it orbits continuously — counterclockwise
 * seen from the north, at its Kepler pace, like every planet — and the clock resets
 * at voyage 0 (invisible — the camera tracks it, the starfield follows the camera,
 * and the system is hidden there). Publishes its world position so the CameraRig can
 * lock onto it. Body pose + self-spin live in Planet.
 *
 * Like the rest of the solar system (see SolarSystem), its orbital offset is
 * turned by the SHARED space rotation (`useSceneRotation`) so a drag rotates the
 * cosmos, the sibling planets AND the Saturn together — one relative control.
 * The shared rotation is BLENDED IN over the very start of the voyage: at voyage
 * 0 it's off, so the Saturn stays exactly on the world origin for the star→Saturn
 * intro regardless of the accumulated scene yaw; by the time the siblings fade in
 * it's full, so the Saturn co-rotates with them around the sun.
 */
const SaturnMember = ({ children }: { children: ReactNode }) => {
  const posRef = useRef<Group>(null);
  const offset = useRef(new Vector3());
  const rotated = useRef(new Vector3());
  const euler = useRef(new Euler());

  useFrame((state) => {
    if (!posRef.current) return;
    const voyage = clamp01(useVoyageScroll.getState().progress);
    const t = systemTime(state.clock.elapsedTime, voyage);

    // Orbital offset from the sun (local to the system, exactly like a sibling).
    const [ox, oy, oz] = orbitPosition(SATURN_ORBIT_RADIUS, saturnAngle(SATURN_ORBIT_RADIUS, t));
    offset.current.set(ox, oy, oz);

    // Same offset turned by the shared scene rotation (matches SolarSystem's
    // group transform), then blended from unrotated → rotated over voyage start
    // so the origin stays fixed during the intro.
    const r = useSceneRotation.getState();
    rotated.current
      .copy(offset.current)
      .applyEuler(euler.current.set(r.pitch, r.yaw, 0));
    const blend = clamp01(voyage / SOLAR.revealStart);

    // Base off the Sun's LIVE position (SUNPOS normally; revolving with the galaxy at
    // the finale), so the Saturn flies WITH the system through the galaxy.
    const sun = flyingSunPos();
    const wx = sun[0] + lerp(ox, rotated.current.x, blend);
    const wy = sun[1] + lerp(oy, rotated.current.y, blend);
    const wz = sun[2] + lerp(oz, rotated.current.z, blend);
    posRef.current.position.set(wx, wy, wz);
    useSaturnAnchor.getState().set(wx, wy, wz);
  });

  return (
    <group ref={posRef}>
      <group scale={SATURN.scale}>{children}</group>
    </group>
  );
};

/**
 * Earth as a normal member of the solar system: the 3rd planet, on its real orbit
 * (EARTH_ELEMENTS, see solar/orbits.ts) on the system's clock, turned by the shared
 * scene rotation exactly like the sibling planets. It never grows or transitions — it
 * just publishes its live world position to `useEarthAnchor` so the CameraRig can fly
 * to it and track it. Body (dots), self-spin and drag live in DottedEarth; its Moon
 * rides along (EarthMoon).
 */
const EarthMember = ({ children }: { children: ReactNode }) => {
  const posRef = useRef<Group>(null);
  const offset = useRef(new Vector3());
  const euler = useRef(new Euler());

  useFrame((state) => {
    if (!posRef.current) return;
    const t = systemTime(state.clock.elapsedTime, useVoyageScroll.getState().progress);
    // Turn the orbital offset by the shared scene rotation (matches the siblings),
    // then place it relative to the sun.
    const r = useSceneRotation.getState();
    orbitPositionAt(EARTH_ELEMENTS, t, offset.current).applyEuler(
      euler.current.set(r.pitch, r.yaw, 0),
    );
    // Base off the Sun's LIVE position so the Earth flies WITH the system at the finale.
    const sun = flyingSunPos();
    const wx = sun[0] + offset.current.x;
    const wy = sun[1] + offset.current.y;
    const wz = sun[2] + offset.current.z;
    posRef.current.position.set(wx, wy, wz);
    useEarthAnchor.getState().set(wx, wy, wz);
  }, ORBIT_PRIORITY);

  return <group ref={posRef}>{children}</group>;
};

/**
 * The Parker Solar Probe on its REAL orbit (parker/orbit.ts: JPL elements, its true
 * position right now, at its real speed), turned by the shared scene rotation like
 * the planets and based off the Sun's LIVE position so it flies with the system in the
 * finale. Publishes to `useParkerAnchor`: the CameraRig flies to it, the probe draws
 * itself there (see ParkerProbe — it's real size, so it places itself each frame).
 */
const ParkerMember = () => {
  const offset = useRef(new Vector3());
  const euler = useRef(new Euler());
  useFrame(() => {
    const r = useSceneRotation.getState();
    parkerOffset(offset.current).applyEuler(euler.current.set(r.pitch, r.yaw, 0));
    const sun = flyingSunPos();
    useParkerAnchor
      .getState()
      .set(sun[0] + offset.current.x, sun[1] + offset.current.y, sun[2] + offset.current.z);
  }, ORBIT_PRIORITY);
  return null;
};

/**
 * Bend a straight camera path a → b away from the Sun: find where the path passes
 * closest to it and, if that's nearer than `clear`, push the camera out there — in ONE
 * fixed direction (Sun → that point), by a smooth bump that is 0 at the start and at
 * the arrival — so the camera arcs past the Sun instead of swinging round it. `u` is
 * how far along the path the camera is (0..1). Adds the push to `out`. `fromClose`:
 * the path starts a few metres from the real-size probe, where even a slight push
 * would be huge — so the bump eases in from the start (smoothstep either side of the
 * closest point), nil next to the probe.
 */
function bendAroundSun(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  u: number,
  clear: number,
  out: [number, number, number],
  fromClose = false,
) {
  const [sx, sy, sz] = flyingSunPos();
  const [ax, ay, az] = a;
  const dx = b[0] - ax;
  const dy = b[1] - ay;
  const dz = b[2] - az;
  const along = clamp01(((sx - ax) * dx + (sy - ay) * dy + (sz - az) * dz) / (dx * dx + dy * dy + dz * dz || 1));
  const cx = ax + dx * along - sx;
  const cy = ay + dy * along - sy;
  const cz = az + dz * along - sz;
  const closest = Math.hypot(cx, cy, cz);
  if (closest < clear && along > 0 && along < 1) {
    const inv = closest > 1e-3 ? 1 / closest : 0;
    const away = closest > 1e-3;
    const nx = away ? cx * inv : 0;
    const ny = away ? cy * inv : 1;
    const nz = away ? cz * inv : 0;
    // (u/along)^m · ((1−u)/(1−along))² — flat at the start, 1 at `along`, 0 on arrival
    // (fromClose: a smoothstep on either side of `along`).
    const t = u < along ? u / along : (1 - u) / (1 - along);
    const bump = fromClose
      ? t * t * (3 - 2 * t)
      : Math.pow(u / along, (2 * along) / (1 - along)) * Math.pow((1 - u) / (1 - along), 2);
    const lift = (clear - closest) * bump;
    out[0] += nx * lift;
    out[1] += ny * lift;
    out[2] += nz * lift;
  }
}

/**
 * The camera does ALL the scroll work, in FOUR chained segments, each a pure
 * (eased) function of one scroll store + live anchors, so the whole path reverses
 * perfectly on scroll-up:
 *
 *   1. Saturn → wide   (useVoyageScroll 0 … VOYAGE.flyoutEnd): from the Saturn
 *      close-up, flies OUT — up + back — easing its aim to the SUN.
 *   2. wide → Earth    (useVoyageScroll flyoutEnd … 1): dives onto the live Earth,
 *      filling the view by perspective while the system fades.
 *   3. Earth → the Parker Solar Probe (useLabScroll), NASA "Eyes" style: a pull
 *      back to the inner solar system, then a zoom onto the real-size probe, ending
 *      in its 3/4 close-up.
 *   4. Parker → Galaxy (useGalaxyScroll): the finale, in two legs — the zoom reversed,
 *      backing away from the probe to the solar-system framing (the whole REAL solar
 *      system fading back in); then ONE exponential pull-out out to `dEnd`, the aim
 *      panning the Sun → the galaxy centre while the view climbs above the disc — so
 *      the solar system shrinks to a speck as the whole galaxy resolves around it.
 *      It starts EXACTLY on the segment-3 close-up.
 */

// ── Segment-4 exponential-zoom constants. Computed once, at module load. ──
// The finale's reference start: the Voyager-era Lab framing (LAB_CAM) the galaxy's
// scale was tuned to — its distance and ¾ direction. (The finale now opens on the Parker
// Solar Probe's close-up and pulls back out to the solar-system framing — segment 4, leg 1.)
const _gStartVec = [
  LAB_CAM.offset[0] - LAB_CAM.look[0],
  LAB_CAM.offset[1] - LAB_CAM.look[1],
  LAB_CAM.offset[2] - LAB_CAM.look[2],
];
const G_D_START = Math.hypot(_gStartVec[0], _gStartVec[1], _gStartVec[2]);
const G_START_DIR: [number, number, number] = [
  _gStartVec[0] / G_D_START,
  _gStartVec[1] / G_D_START,
  _gStartVec[2] / G_D_START,
];
const _gEndLen = Math.hypot(
  GALAXY_ZOOM.endDir[0],
  GALAXY_ZOOM.endDir[1],
  GALAXY_ZOOM.endDir[2],
);
const G_END_DIR: [number, number, number] = [
  GALAXY_ZOOM.endDir[0] / _gEndLen,
  GALAXY_ZOOM.endDir[1] / _gEndLen,
  GALAXY_ZOOM.endDir[2] / _gEndLen,
];
const G_Z_RATIO = GALAXY_ZOOM.dEnd / G_D_START;
const _inspectPos = new Vector3(); // the dev inspect camera's target (scratch)
const _closeDir = new Vector3(); // the Parker close-up's direction (scratch)
const _fromDir = new Vector3(); // the Lab turn's view directions (scratch)
const _toDir = new Vector3();

// The rig's path points, reused every frame instead of allocated (P27-78).
type Point3 = [number, number, number];
const _pathFrom: Point3 = [0, 0, 0];
const _pathTo: Point3 = [0, 0, 0];
const _bent: Point3 = [0, 0, 0];
const _over: Point3 = [0, 0, 0];
const _home: Point3 = [0, 0, 0];
const _labCam: Point3 = [0, 0, 0];
const _probe: Point3 = [0, 0, 0];
const _frame: Point3 = [0, 0, 0];
const _outCam: Point3 = [0, 0, 0];
const _keyX: number[] = []; // the Lab zoom's keyframes: progress…
const _keyLogD: number[] = []; // …and log distance

// Fitting the subjects on portrait screens (scene/portraitFit, P27-31): each one's span,
// as framed today, with a little room around it.
/** Saturn and its rings, framed from CAMERA.z. */
const SATURN_SPAN = spanOf((RING.outer * SATURN.scale) / CAMERA.z, CAMERA.fov, 1.08);
/** The camera stands back over Saturn's growth (its assembly's own curve, PlanetBody). */
const SATURN_FIT_GROWN = 0.82;
/** The whole solar system at the finale's rest on it: out to its farthest orbit (aphelion). */
const SYSTEM_SPAN = spanOf(
  Math.max(...PLANETS.map(({ orbit }) => orbitRadius(orbit.au * (1 + orbit.e)))) /
    (G_D_START * Math.pow(G_Z_RATIO, GALAXY_ZOOM.panSunEnd)),
  CAMERA.fov,
  1.05,
);
/** The whole galaxy in its full view (live: the dev panel tunes its size and distance). */
const galaxySpan = () =>
  spanOf((GALAXY.discRadius * GALAXY_SCALE) / (GALAXY_ZOOM.dEnd / GALAXY_ZOOM.endCloser), CAMERA.fov, 1.03);
/** The Earth at its arrival (EARTH_CAM.offset), with room for its photo pins and their labels. */
const EARTH_SPAN = spanOf(
  Math.tan(Math.asin(EARTH_RADIUS / Math.hypot(...EARTH_CAM.offset))),
  CAMERA.fov,
  1.2,
);

function set3(out: Point3, x: number, y: number, z: number): Point3 {
  out[0] = x;
  out[1] = y;
  out[2] = z;
  return out;
}

/**
 * Turn the unit view direction `from` toward `to` by the share `t`, at a steady
 * angular rate (a true rotation, not a slide of the aim point). Writes into `from`.
 */
function turnToward(from: Vector3, to: Vector3, t: number) {
  from.normalize();
  to.normalize();
  const angle = Math.acos(Math.min(1, Math.max(-1, from.dot(to))));
  if (angle < 1e-6 || t <= 0) return from;
  if (t >= 1) return from.copy(to);
  const sin = Math.sin(angle);
  const a = Math.sin((1 - t) * angle) / sin;
  const b = Math.sin(t * angle) / sin;
  return from.multiplyScalar(a).addScaledVector(to, b).normalize();
}

/** The Lab overview's direction from the Sun: the voyage's wide view (angled from above). */
const _overDir = new Vector3(0, FLYOUT.rise, CAMERA.z + FLYOUT.distance)
  .sub(new Vector3(...SUNPOS))
  .normalize();

const CameraRig = ({
  starfieldRef,
}: {
  starfieldRef: RefObject<Group | null>;
}) => {
  const camera = useThree((s) => s.camera);
  useFrame(() => {
    const a = useSaturnAnchor.getState();
    const voyage = clamp01(useVoyageScroll.getState().progress);

    // ── Segment 1: Saturn → wide sun-centred view ──
    // The story's standard curve (P27-77): it leaves the Saturn slowly, speeds up, and
    // settles on the wide view — where the dive then starts from rest.
    // On a portrait screen the camera stands back as Saturn forms (along its growth
    // curve), so it and its rings fit the width (P27-31); exactly 1 elsewhere.
    const grown = remap01(useAboutScroll.getState().progress, 0, SATURN_FIT_GROWN);
    const saturnFit = fitRamp(
      portraitFit((camera as PerspectiveCamera).aspect, SATURN_SPAN),
      grown * grown * (3 - 2 * grown),
    );
    const fly = storyEase(clamp01(voyage / VOYAGE.flyoutEnd));
    let px = lerp(a.x, 0, fly);
    let py = lerp(a.y, FLYOUT.rise, fly);
    let pz = lerp(a.z + CAMERA.z * saturnFit, CAMERA.z + FLYOUT.distance, fly);
    let lx = lerp(a.x, SUNPOS[0], fly);
    let ly = lerp(a.y, SUNPOS[1], fly);
    let lz = lerp(a.z, SUNPOS[2], fly);

    // ── Segment 2: wide → Earth dive (fly to the LIVE orbiting Earth) ──
    // The story's standard curve (storyEase) → the camera eases out of the wide view and
    // GLIDES TO REST as the Earth fills the frame (velocity → 0 at arrival), so it settles
    // smoothly into the dwell instead of slamming to a stop.
    // The real-size Earth is tiny, so the distance to it closes as a steady ZOOM
    // (EARTH_CAM.steadyZoom): along the same straight path, the remaining distance
    // shrinks by the same factor each step instead of at a constant speed.
    const ap = remap01(voyage, VOYAGE.flyoutEnd, 1);
    if (ap > 0) {
      const apE = storyEase(ap); // the story's standard curve (P27-77)
      const e = useEarthAnchor.getState();
      // The arrival pose: farther back on a portrait screen, so the whole Earth fits
      // (P27-31); the Lab's pull-back then sets off from wherever this lands.
      const earthFit = portraitFit((camera as PerspectiveCamera).aspect, EARTH_SPAN);
      const ox = EARTH_CAM.offset[0] * earthFit;
      const oy = EARTH_CAM.offset[1] * earthFit;
      const oz = EARTH_CAM.offset[2] * earthFit;
      // The straight path: from the wide view (segment 1) to the arrival pose.
      const ax = px;
      const ay = py;
      const az = pz;
      const bx = e.x + ox;
      const by = e.y + oy;
      const bz = e.z + oz;
      const dEnd = Math.hypot(ox, oy, oz);
      const d0 = Math.max(Math.hypot(ax - e.x, ay - e.y, az - e.z), dEnd + 1e-3);
      const d = d0 * Math.pow(dEnd / d0, apE); // distance to the Earth, zooming evenly
      const zoomed = 1 - (d - dEnd) / (d0 - dEnd);
      const u = lerp(apE, zoomed, EARTH_CAM.steadyZoom);
      px = lerp(ax, bx, u);
      py = lerp(ay, by, u);
      pz = lerp(az, bz, u);
      lx = lerp(lx, e.x, u);
      ly = lerp(ly, e.y, u);
      lz = lerp(lz, e.z, u);

      // The Earth is the 3rd planet, close to the Sun: when it's behind the Sun, the
      // straight path would fly through it — so it bends round the Sun (bendAroundSun).
      const bent = set3(_bent, px, py, pz);
      bendAroundSun(set3(_pathFrom, ax, ay, az), set3(_pathTo, bx, by, bz), u, EARTH_CAM.sunClear, bent);
      [px, py, pz] = bent;
    }

    // ── Segment 3: the Lab — Earth → the Parker Solar Probe, NASA "Eyes" style (see
    // PARKER_CAM): a steady zoom OUT from the full Earth view to an overview of the
    // inner solar system (angled from above, the view turning from the Earth to the Sun),
    // arriving still moving — no hold, like the Saturn fly-out into the Earth dive; the
    // PSP marked on its orbit. Then the zoom into the real-size probe
    // (~0.00000008 units): the camera flies straight at it, its distance following one
    // smooth curve through PARKER_CAM.zoomKeys — normal speed while the scene is on screen,
    // fast through the empty stretch (only its tooltip), slow for the arrival — swinging
    // round to the 3/4 close-up side (the solar system fading to focus on it). A pure
    // function of useLabScroll + the live anchors → reverses on scroll-up.
    const lab = clamp01(useLabScroll.getState().progress);
    if (lab > 0) {
      const C = PARKER_CAM;
      const pk = useParkerAnchor.getState();
      const sun = flyingSunPos();
      const earth = useEarthAnchor.getState();
      // The overview: the Sun centred, angled from above.
      const over = set3(
        _over,
        sun[0] + _overDir.x * C.overview,
        sun[1] + _overDir.y * C.overview,
        sun[2] + _overDir.z * C.overview,
      );
      // 1. Pull back from the Earth pose (segment 2): a steady zoom out — the distance
      //    from the Earth grows by the same factor each step (the Earth arrival, reversed).
      const home = set3(_home, px, py, pz);
      const back = storyEase(remap01(lab, C.pullBack[0], C.pullBack[1])); // the standard curve (P27-77)
      const dE0 = Math.max(Math.hypot(px - earth.x, py - earth.y, pz - earth.z), 1e-3);
      const dE1 = Math.hypot(over[0] - earth.x, over[1] - earth.y, over[2] - earth.z);
      const dE = dE0 * Math.pow(dE1 / dE0, back);
      const u = clamp01((dE - dE0) / (dE1 - dE0 || 1));
      const cam = set3(_labCam, lerp(px, over[0], u), lerp(py, over[1], u), lerp(pz, over[2], u));
      bendAroundSun(home, over, u, EARTH_CAM.sunClear, cam);
      // 3. The zoom into the probe, setting off from the overview as the pull-back arrives.
      const keys = C.zoomKeys;
      let flown = -1; // the share of the distance to the probe flown (−1: not zooming yet)
      if (lab > keys[0][0]) {
        let fx = over[0] - pk.x;
        let fy = over[1] - pk.y;
        let fz = over[2] - pk.z;
        const d0 = Math.hypot(fx, fy, fz) || 1;
        fx /= d0;
        fy /= d0;
        fz /= d0;
        _keyX.length = keys.length;
        _keyLogD.length = keys.length;
        for (let i = 0; i < keys.length; i++) {
          _keyX[i] = keys[i][0];
          _keyLogD[i] = Math.log(keys[i][1] ?? d0);
        }
        const d = Math.exp(monotoneCurve(lab, _keyX, _keyLogD));
        const close = parkerViewDir(_closeDir, pk.x, pk.y, pk.z, sun);
        const e = remap01(lab, C.swing[0], C.swing[1]);
        const sw = e * e * (3 - 2 * e); // the swing to the close-up side, over the arrival
        let dx = lerp(fx, close.x, sw);
        let dy = lerp(fy, close.y, sw);
        let dz = lerp(fz, close.z, sw);
        const dl = Math.hypot(dx, dy, dz) || 1;
        cam[0] = pk.x + (dx / dl) * d;
        cam[1] = pk.y + (dy / dl) * d;
        cam[2] = pk.z + (dz / dl) * d;
        const dEnd = keys[keys.length - 1][1] ?? d0;
        flown = clamp01((d0 - d) / (d0 - dEnd));
      }
      [px, py, pz] = cam;
      if (flown < 0) {
        // The view turns at a steady rate from the Earth to the Sun as it pulls back.
        turnToward(_fromDir.set(earth.x - px, earth.y - py, earth.z - pz), _toDir.set(sun[0] - px, sun[1] - py, sun[2] - pz), back);
      } else {
        // Like the Earth dive, the aim slides from the Sun to the probe with the distance
        // flown — so the view holds still (no turn in place): the probe keeps its place
        // on screen while the camera flies straight at it, and centres on arrival.
        _fromDir.set(lerp(sun[0], pk.x, flown) - px, lerp(sun[1], pk.y, flown) - py, lerp(sun[2], pk.z, flown) - pz).normalize();
      }
      lx = px + _fromDir.x;
      ly = py + _fromDir.y;
      lz = pz + _fromDir.z;
    }

    // ── Segment 4: the finale — ONE exponential pull-out. At galaxy = 0 this
    // reproduces the segment-3 close-up of the Parker Solar Probe exactly, so it takes
    // over seamlessly, then flies OUT: it backs away from the probe to the solar-system
    // framing (the Lab's zoom in, reversed), then the distance grows exponentially
    // while the aim pans the (flying) Sun → the galaxy centre. Anchored on the
    // LIVE Sun position (`flyingSunPos`), so scrolling BACK zooms into the solar
    // system wherever it has flown to in the galaxy — not back to a fixed home.
    // A pure function of useGalaxyScroll (+ the live Sun) → reverses on scroll-up.
    const galaxy = clamp01(useGalaxyScroll.getState().progress);
    let framing = 0; // how much the galaxy framing applies (the leg-2 pan, below)
    // After landing: the gentle drift back before the Contact form (eased).
    const drift = storyEase(clamp01(useGalaxyScroll.getState().drift));
    const driftScale = 1 + (1 / (1 - GALAXY_ZOOM.driftBack) - 1) * drift;
    // On a portrait screen the full view stands farther back, so the whole spiral fits
    // the width (P27-31); exactly 1 elsewhere. Built up over leg 2, like its framing.
    const galaxyFit = portraitFit((camera as PerspectiveCamera).aspect, galaxySpan());
    // …and the rest on the whole solar system (leg 1's end), so its farthest orbit fits.
    const systemFit = portraitFit((camera as PerspectiveCamera).aspect, SYSTEM_SPAN);
    if (galaxy > 0) {
      const z = galaxy;
      const ps = GALAXY_ZOOM.panSunEnd;
      const sun = flyingSunPos();
      // Distance grows exponentially with raw z (the prototype feel).
      const dist = G_D_START * Math.pow(G_Z_RATIO, z);
      if (z <= ps) {
        // Leg 1: the Lab's zoom into the probe, reversed — the camera backs straight away
        // from the real-size probe toward the finale's solar-system framing (the Sun
        // centred, from the ¾ side), swinging off the close-up side as it departs; its
        // distance grows in log space on the story's standard curve (P27-77: slow → fast
        // through the empty stretch → slow onto the system), the aim sliding from the
        // probe to the Sun with the distance flown (the view holds still — no turn in
        // place). The probe flies with the system, so its framing does too.
        const C = PARKER_CAM;
        const [sx, sy, sz] = sun;
        const pk = useParkerAnchor.getState();
        const dFrame = G_D_START * Math.pow(G_Z_RATIO, ps) * systemFit;
        const frame = set3(
          _frame,
          sx + G_START_DIR[0] * dFrame,
          sy + G_START_DIR[1] * dFrame,
          sz + G_START_DIR[2] * dFrame,
        );
        let fx = frame[0] - pk.x;
        let fy = frame[1] - pk.y;
        let fz = frame[2] - pk.z;
        const d1 = Math.hypot(fx, fy, fz) || 1;
        fx /= d1;
        fy /= d1;
        fz /= d1;
        const dStart = C.distance * METRE; // the close-up
        const d = Math.exp(lerp(Math.log(dStart), Math.log(d1), storyEase(z / ps)));
        const close = parkerViewDir(_closeDir, pk.x, pk.y, pk.z, sun);
        const e = remap01(z, C.pullOutSwing[0], C.pullOutSwing[1]);
        const sw = e * e * (3 - 2 * e);
        let dx = lerp(close.x, fx, sw);
        let dy = lerp(close.y, fy, sw);
        let dz = lerp(close.z, fz, sw);
        const dl = Math.hypot(dx, dy, dz) || 1;
        const cam = set3(_outCam, pk.x + (dx / dl) * d, pk.y + (dy / dl) * d, pk.z + (dz / dl) * d);
        // When the probe is on the far side of the Sun, the way out bends round it.
        bendAroundSun(set3(_probe, pk.x, pk.y, pk.z), frame, clamp01(d / d1), EARTH_CAM.sunClear, cam, true);
        [px, py, pz] = cam;
        const flown = clamp01((d - dStart) / (d1 - dStart));
        _fromDir.set(lerp(pk.x, sx, flown) - px, lerp(pk.y, sy, flown) - py, lerp(pk.z, sz, flown) - pz).normalize();
        lx = px + _fromDir.x;
        ly = py + _fromDir.y;
        lz = pz + _fromDir.z;
      } else {
        // Leg 2: aim pans the (flying) Sun → galaxy centre while the view swings to the
        // study pose, so the solar system shrinks and the whole spiral frames up. The
        // centre is the LIVE one (a drag turns the galaxy about the Sun).
        const e = (z - ps) / (1 - ps);
        let s = e * e * (3 - 2 * e);
        if (GALAXY_ZOOM.curve !== 1) s = Math.pow(s, GALAXY_ZOOM.curve);
        const [sx, sy, sz] = sun;
        const [cx, cy, cz] = galaxyCenterPos();
        lx = lerp(sx, cx, s);
        ly = lerp(sy, cy, s);
        lz = lerp(sz, cz, s);
        // …ending a little closer than the study framing (GALAXY_ZOOM.endCloser),
        // built up over this leg so the solar-system framing is unchanged.
        // (From the solar system's fit at its start to the galaxy's: exactly 1 on landscape.)
        const d2 = (dist / Math.pow(GALAXY_ZOOM.endCloser, e)) * driftScale * lerp(systemFit, galaxyFit, s);
        let dx = lerp(G_START_DIR[0], G_END_DIR[0], s);
        let dy = lerp(G_START_DIR[1], G_END_DIR[1], s);
        let dz = lerp(G_START_DIR[2], G_END_DIR[2], s);
        const dl = Math.hypot(dx, dy, dz) || 1;
        dx /= dl;
        dy /= dl;
        dz /= dl;
        px = lx + dx * d2;
        py = ly + dy * d2;
        pz = lz + dz * d2;
        framing = s;
      }
    }

    // Dev only: the panel's "inspect planet" camera (PlanetGui) — close to one planet,
    // at a chosen angle from the Sun (planetInspect.sunAngle), so even the speck-sized
    // ones can be seen and tuned.
    const inspectedBody = planetInspect.id ? planetInspect.bodies[planetInspect.id] : undefined;
    if (inspectedBody) {
      const inspected = inspectedBody.object.getWorldPosition(_inspectPos);
      const [sx, sy, sz] = flyingSunPos();
      let tx = sx - inspected.x;
      let ty = sy - inspected.y;
      let tz = sz - inspected.z;
      const tl = Math.hypot(tx, ty, tz) || 1;
      tx /= tl;
      ty /= tl;
      tz /= tl;
      // Swing the view from the Sun's direction toward the side (toSun × up), a touch
      // from above.
      const sl = Math.hypot(tz, tx) || 1;
      const ang = (planetInspect.sunAngle * Math.PI) / 180;
      let dx = tx * Math.cos(ang) - (tz / sl) * Math.sin(ang);
      let dy = ty * Math.cos(ang) + 0.25;
      let dz = tz * Math.cos(ang) + (tx / sl) * Math.sin(ang);
      const dl = Math.hypot(dx, dy, dz);
      const dist = inspectedBody.size * planetInspect.distance;
      dx = (dx / dl) * dist;
      dy = (dy / dl) * dist;
      dz = (dz / dl) * dist;
      px = inspected.x + dx;
      py = inspected.y + dy;
      pz = inspected.z + dz;
      lx = inspected.x;
      ly = inspected.y;
      lz = inspected.z;
    }

    camera.position.set(px, py, pz);
    camera.lookAt(lx, ly, lz);
    // Centre the whole galaxy on screen as it frames up (turns the camera slightly —
    // the pose is unchanged; the sky is kept in place — see galaxy/framing.ts).
    frameGalaxy(camera as PerspectiveCamera, framing, driftScale * galaxyFit);
    // Pin the starfield to the camera in the SAME frame the camera moves (this
    // rig runs last), so the stars sit at a constant distance and never lag — no
    // velocity-coupled size "pumping" as you scroll.
    starfieldRef.current?.position.copy(camera.position);
  });
  return null;
};

/**
 * While the panel is open (a place's photos or the Lab), lock the journey to it: pause
 * ScrollSmoother so the wheel/touch can't advance the story, and disable pointer events
 * on the canvas so drags don't fire "space events" behind the panel (the Earth's pins
 * ignore R3F's events themselves; a pin lit when it opened goes dark). The panel
 * (portalled outside #smooth-content) keeps its own scroll + clicks. Everything restores
 * when the panel closes.
 */
const InteractionLock = () => {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const apply = (locked: boolean) => {
      gl.domElement.style.pointerEvents = locked ? "none" : "auto";
      if (locked) {
        pinHover.id = null;
        document.body.style.cursor = "";
      }
      // Freeze the journey via the shared lock registry (stores/scrollLock) so
      // any lock source coordinates without clobbering ScrollSmoother.paused().
      setScrollLock("panel", locked);
    };
    apply(selectIsOpen(usePanelStore.getState()));
    const unsubscribe = usePanelStore.subscribe((s, prev) => {
      if (selectIsOpen(s) !== selectIsOpen(prev)) apply(selectIsOpen(s));
    });
    return () => {
      unsubscribe();
      gl.domElement.style.pointerEvents = "auto";
      setScrollLock("panel", false);
    };
  }, [gl]);
  return null;
};

/** Whether RenderPause is skipping the draw (shared with the QualityMonitor). */
const renderPause = { paused: false, drawOnce: false };

/** Scroll (in master progress) the pause stays clear of the Craft's edges: ~10% of a screen. */
const COVER_MARGIN = mpAt(10);
/** The Lightbox's fade-in (its `duration-300`): pause only once it fully covers. */
const LIGHTBOX_FADE_MS = 300;

/**
 * Skips drawing while the 3D is fully covered (P27-78, `PERFORMANCE.pauseCovered`): under
 * the opaque Craft overlay, and under the Lightbox (95% opaque) once it has faded in.
 * Only the GPU work stops — the composer's render is skipped, so the canvas keeps its
 * last frame, while every useFrame (orbits, anchors, labels) and the clock run on. (Not
 * R3F's frameloop: switching it resets the clock, so the planets would jump.) It resumes
 * a little before the Craft uncovers the canvas, so the first frame you see is fresh,
 * and draws one frame on resize (a resize clears the canvas).
 */
const RenderPause = ({
  composerRef,
}: {
  composerRef: RefObject<EffectComposerImpl | null>;
}) => {
  const size = useThree((s) => s.size);

  useEffect(() => {
    const composer = composerRef.current;
    if (!composer) return;
    const original = composer.render;
    composer.render = (deltaTime?: number) => {
      if (renderPause.paused && !renderPause.drawOnce) return;
      renderPause.drawOnce = false;
      original.call(composer, deltaTime);
    };

    let lightboxCovers = false;
    let lightboxTimer = 0;
    const update = () => {
      const mp = useJourneyScroll.getState().progress;
      const craftCovers =
        mp > JOURNEY.craftCoverEnd + COVER_MARGIN && mp < JOURNEY.craftFadeStart - COVER_MARGIN;
      renderPause.paused = PERFORMANCE.pauseCovered && (craftCovers || lightboxCovers);
    };
    const onPanel = () => {
      const open = usePanelStore.getState().photo !== null;
      window.clearTimeout(lightboxTimer);
      if (!open) lightboxCovers = false;
      else if (!lightboxCovers) {
        lightboxTimer = window.setTimeout(() => {
          lightboxCovers = true;
          update();
        }, LIGHTBOX_FADE_MS);
      }
      update();
    };

    update();
    const unsubscribe = [
      useJourneyScroll.subscribe(update),
      usePanelStore.subscribe(onPanel),
      onPerformanceChange(update),
    ];
    return () => {
      unsubscribe.forEach((u) => u());
      window.clearTimeout(lightboxTimer);
      composer.render = original;
    };
  }, [composerRef]);

  useEffect(() => {
    renderPause.drawOnce = true;
  }, [size]);

  return null;
};

/** At the latest this long after load, the background compile starts anyway. */
const WARM_UP_TIMEOUT_MS = 3000;

/**
 * Compiles every shader in the scene in the background soon after load (P27-78), hidden
 * ones too (the Lab's probe, the orbit lines…), so no chapter stalls on its first frame
 * (see warmUp); then runs the veil's blurs once, so their shaders and buffers are ready
 * before the About. (The galaxy warms its own layer.) In production it also skips
 * three's per-shader error checks, which read back each program's logs on first use.
 */
const ShaderWarmUp = ({
  composerRef,
  veil,
}: {
  composerRef: RefObject<EffectComposerImpl | null>;
  veil: VeilEffect;
}) => {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") gl.debug.checkShaderErrors = false;
    setWarmUpTarget(() => composerRef.current?.inputBuffer ?? null);
    let cancelled = false;
    const cancelIdle = whenIdle(() => {
      void precompile(gl, scene, camera).then(() => {
        const composer = composerRef.current;
        if (!cancelled && composer) veil.warmUp(gl, composer.inputBuffer);
      });
    }, WARM_UP_TIMEOUT_MS);
    return () => {
      cancelled = true;
      cancelIdle();
    };
  }, [gl, scene, camera, composerRef, veil]);
  return null;
};

/**
 * The composer's multisampling follows `PERFORMANCE.msaa` (P27-78): 4× by default — the
 * soft dots smooth their own edges, and 8× cost a lot of memory bandwidth on integrated
 * GPUs for no visible gain. postprocessing's setter re-allocates the scene buffers.
 */
const Multisampling = ({
  composerRef,
}: {
  composerRef: RefObject<EffectComposerImpl | null>;
}) => {
  useEffect(() => {
    const sync = () => {
      const composer = composerRef.current;
      // The quality tiers turn it off on slow GPUs.
      const msaa = QUALITY_STEPS[useQuality.getState().step].msaa ? PERFORMANCE.msaa : 0;
      if (composer && composer.multisampling !== msaa) composer.multisampling = msaa;
    };
    sync();
    const unsubscribe = [onPerformanceChange(sync), useQuality.subscribe(sync)];
    return () => unsubscribe.forEach((u) => u());
  }, [composerRef]);
  return null;
};

/**
 * When the quality tiers change the canvas's pixel ratio, resize the composer's buffers
 * to match: by itself it only follows the canvas's CSS size.
 */
const ComposerResize = ({
  composerRef,
}: {
  composerRef: RefObject<EffectComposerImpl | null>;
}) => {
  const dpr = useThree((s) => s.viewport.dpr);
  const get = useThree((s) => s.get);
  const applied = useRef(dpr);
  useEffect(() => {
    if (dpr === applied.current) return;
    applied.current = dpr;
    const { size } = get();
    composerRef.current?.setSize(size.width, size.height);
  }, [dpr, get, composerRef]);
  return null;
};

/**
 * The automatic quality tiers (P27-78): start from a guess by GPU (integrated one step
 * lower), then measure every frame and step the quality down quickly or back up slowly
 * to hold 60 FPS (see qualityController). Frames drawn while the render is paused are
 * cheap, so they don't count. The dev panel's "quality" switch pins a step instead.
 */
const QualityMonitor = () => {
  const gl = useThree((s) => s.gl);
  const controller = useRef<QualityController | null>(null);

  useEffect(() => {
    const renderer = gpuRenderer(gl);
    const start = startStep(renderer);
    recordQualityStart(start, gpuClass(renderer));
    const apply = () => {
      const pinned = PERFORMANCE.quality;
      if (pinned !== "auto") {
        controller.current = null;
        useQuality.getState().setStep(pinned);
      } else if (!controller.current) {
        controller.current = createQualityController(start, LOWEST_STEP, performance.now());
        useQuality.getState().setStep(start);
      }
    };
    apply();
    const unsubscribe = onPerformanceChange(apply);
    return () => {
      unsubscribe();
      controller.current = null;
    };
  }, [gl]);

  useFrame((_, delta) => {
    const c = controller.current;
    if (!c || renderPause.paused || document.hidden) return;
    const from = c.step;
    const next = c.sample(delta * 1000, performance.now());
    if (next === null) return;
    recordQualityChange(from, next, c.fps);
    useQuality.getState().setStep(next);
  });
  return null;
};

/**
 * Eases the Bloom intensity down as Saturn assembles: full glow through the
 * star + explosion, fading toward 0 by the time the planet has formed, so
 * Saturn reads as a crisp body of particles rather than a glowing blob.
 *
 * For the galaxy finale it ramps in the soft highlight roll-off over
 * `GALAXY_FX.fxIn` (the galaxy's reveal), so every earlier beat is untouched. (The
 * galaxy's bloom is its own — see galaxy/GalaxyBloom.) And it drives the veils
 * (VeilEffect) — the About's, the panel's full view (P27-80) and the Contact's, the
 * strongest one showing — which skip their blur while there's nothing to veil.
 */
const BloomController = ({
  bloom,
  veil,
  highlightsRef,
}: {
  bloom: BloomEffect;
  veil: VeilEffect;
  highlightsRef: RefObject<SoftHighlightsEffect | null>;
}) => {
  const panelVeil = useRef(0); // eased toward cosmicVeil.panel
  useFrame(({ gl }, delta) => {
    // The veils (written by the journey). The dims are screen-value brightnesses; the
    // effect works in linear light.
    veil.quality = PERFORMANCE.blurQuality;
    const about = PERFORMANCE.aboutBlur === "3d" ? cosmicVeil.about : 0;
    const target = cosmicVeil.panel;
    panelVeil.current =
      Math.abs(target - panelVeil.current) < 0.001
        ? target
        : damp(panelVeil.current, target, PANEL_VEIL.damping, delta);
    const panel = panelVeil.current;
    if (about > 0.001) {
      // Behind the About: the look of its original CSS filter — a blur growing to
      // `revealBlur` CSS px, dimmed to `revealDim` — faded in over the first quarter
      // (the blur buffer is lower-res, so it can't start at full strength).
      veil.veil = Math.min(1, about * 4);
      veil.radius = JOURNEY.revealBlur * gl.getPixelRatio() * about;
      veil.dim = Math.pow(1 - (1 - JOURNEY.revealDim) * about, 2.2);
    } else if (panel > cosmicVeil.contact) {
      // Behind the panel's full view: the same kind of veil, lighter (PANEL_VEIL).
      veil.veil = Math.min(1, panel * 4);
      veil.radius = PANEL_VEIL.blur * gl.getPixelRatio() * panel;
      veil.dim = Math.pow(1 - (1 - PANEL_VEIL.dim) * panel, 2.2);
    } else {
      const contact = cosmicVeil.contact;
      veil.veil = contact;
      veil.dim = lerp(1, Math.pow(JOURNEY.contactDim, 2.2), contact);
      veil.spread = JOURNEY.contactBlur;
    }
    if (highlightsRef.current) {
      highlightsRef.current.knee = GALAXY_FX.highlightKnee; // live-tunable (GalaxyGui)
      const galaxy = clamp01(useGalaxyScroll.getState().progress);
      highlightsRef.current.strength = easeInOutCubic(
        remap01(galaxy, GALAXY_FX.fxIn[0], GALAXY_FX.fxIn[1]),
      );
    }
    const progress = useAboutScroll.getState().progress;
    bloom.intensity =
      BLOOM.intensity * (1 - remap01(progress, 0.05, 0.6));
  });
  return null;
};
