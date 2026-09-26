"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect } from "postprocessing";
import { ReactNode, RefObject, useEffect, useMemo, useRef } from "react";
import { Euler, Group, PerspectiveCamera, Vector3 } from "three";
import Universe from "#/components/three.js/star/Universe";
import { BLOOM, CAMERA, JOURNEY, PARTICLES } from "#/components/three.js/star/config";
import {
  clamp01,
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
  orbitPosition,
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
import Voyager from "#/components/three.js/voyager/Voyager";
import TravelDust from "#/components/three.js/voyager/TravelDust";
import PaleBlueDot from "#/components/three.js/voyager/PaleBlueDot";
import { LAB_CAM, VOYAGER_POS } from "#/components/three.js/voyager/config";
import Galaxy from "#/components/three.js/galaxy/Galaxy";
import GalaxyGui from "#/components/three.js/galaxy/GalaxyGui";
import PerfProbe from "./PerfProbe";
import {
  GALAXY_FX,
  GALAXY_ZOOM,
} from "#/components/three.js/galaxy/config";
import { SoftHighlights, SoftHighlightsEffect } from "./SoftHighlights";
import { VeilPass } from "./VeilPass";
import { cosmicVeil } from "#/stores/cosmicVeil";
import { flyingSunPos, flyOffset, galaxyCenterPos } from "#/components/three.js/galaxy/spin";
import { frameGalaxy } from "#/components/three.js/galaxy/framing";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { useLabScroll } from "#/stores/useLabScroll";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useSceneRotation } from "#/stores/useSceneRotation";
import { useSaturnAnchor } from "#/stores/useSaturnAnchor";
import { useEarthAnchor } from "#/stores/useEarthAnchor";
import { useVoyagerAnchor } from "#/stores/useVoyagerAnchor";
import { useGalleryStore } from "#/stores/useGalleryStore";
import { useLabStore } from "#/stores/useLabStore";
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
  // Blurs + dims the scene behind the Contact form (see VeilPass).
  const veil = useMemo(() => new VeilPass(), []);
  useEffect(() => () => veil.dispose(), [veil]);
  // The starfield group — CameraRig pins it to the camera each frame (see below),
  // so it's shared between Universe (which rotates it) and CameraRig.
  const starfieldRef = useRef<Group>(null);

  return (
    <>
      <Canvas
        // far is large enough for the galaxy finale, where the camera pulls out to
        // ~1300 world units to frame the whole (scaled-up) spiral. near stays close
        // so the readable near-field beats (Voyager, Earth) keep their depth detail.
        camera={{
          position: [0, 0, CAMERA.z],
          fov: CAMERA.fov,
          near: 0.1,
          far: 2800,
        }}
        dpr={[1, 1.5]}
        // (No canvas antialiasing: only the composer's final full-screen pass reaches
        // the canvas; the composer smooths the scene itself, 8× multisampled.)
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

        {/* The Lab — Voyager 1. A SOLID, lit craft (the one man-made object among
          the particle worlds), so it needs the scene's only real lights. The
          camera pulls back from Earth and flies to it (CameraRig segment 3). */}
        <ambientLight intensity={0.6} color="#50505a" />
        <directionalLight
          position={[-4, 5, 6]}
          intensity={1.6}
          color="#fff0dd"
        />
        <directionalLight
          position={[5, -2, -4]}
          intensity={0.4}
          color="#9ec2ff"
        />
        <VoyagerMember>
          <Voyager />
        </VoyagerMember>

        {/* The dust rush past the camera on the Earth→Voyager trip, and the lonely
          pale-blue Earth left far behind (Voyager's real "Pale Blue Dot"). */}
        <TravelDust />
        <PaleBlueDot />

        {/* The Galaxy finale — ONE exponential pull-out (CameraRig segment 4). The
          camera backs off the Voyager; the REAL solar system (Sun + planets, above)
          fades back in and frames up "fully visible", then shrinks as we keep flying
          out through the galaxy's own (fixed-size) stars until the whole brand-tinted
          spiral resolves around it. The galaxy is huge + world-fixed and centred so
          the real Sun sits in one of its arms — our "You are here". */}
        <Galaxy animate={animate} />

        <EffectComposer>
          {/* First, so the effects pass after it still writes the final (encoded) output. */}
          <primitive object={veil} dispose={null} />
          <primitive object={bloom} dispose={null} />
          {/* The galaxy finale's camera-like highlight roll-off (strength ramped by
            BloomController, so it's off for every earlier beat). */}
          <SoftHighlights ref={highlightsRef} knee={GALAXY_FX.highlightKnee} />
        </EffectComposer>

        <BloomController bloom={bloom} veil={veil} highlightsRef={highlightsRef} />
        <CameraRig starfieldRef={starfieldRef} />
        <InteractionLock />
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
 * Voyager sits at a FIXED world position (VOYAGER_POS) — the empty origin — and
 * publishes it to `useVoyagerAnchor` so the CameraRig can fly to it in the Lab
 * beat. Unlike the orbiting Saturn/Earth it doesn't move; only the camera does.
 * At the finale it travels WITH the solar system as it flies through the galaxy
 * (`flyOffset` — zero whenever the Lab is on screen).
 */
const VoyagerMember = ({ children }: { children: ReactNode }) => {
  const posRef = useRef<Group>(null);
  useFrame(() => {
    if (!posRef.current) return;
    const [ox, oy, oz] = flyOffset();
    const x = VOYAGER_POS[0] + ox;
    const y = VOYAGER_POS[1] + oy;
    const z = VOYAGER_POS[2] + oz;
    posRef.current.position.set(x, y, z);
    useVoyagerAnchor.getState().set(x, y, z);
  });
  return <group ref={posRef}>{children}</group>;
};

/**
 * The camera does ALL the scroll work, in FOUR chained segments, each a pure
 * (eased) function of one scroll store + live anchors, so the whole path reverses
 * perfectly on scroll-up:
 *
 *   1. Saturn → wide   (useVoyageScroll 0 … VOYAGE.flyoutEnd): from the Saturn
 *      close-up, flies OUT — up + back — easing its aim to the SUN.
 *   2. wide → Earth    (useVoyageScroll flyoutEnd … 1): dives onto the live Earth,
 *      filling the view by perspective while the system fades.
 *   3. Earth → Voyager (useLabScroll): one smooth fly to the readable Voyager pose.
 *   4. Voyager → Galaxy (useGalaxyScroll): ONE exponential pull-out — the finale.
 *      Distance grows exponentially from the Voyager framing out to `dEnd`. The aim
 *      pans in two legs — Voyager → the Sun (framing the whole REAL solar system,
 *      which fades back in), then Sun → the galaxy centre while the view climbs above
 *      the disc — so the solar system shrinks to a speck as the whole galaxy resolves
 *      around it. Derived to start EXACTLY on the segment-3 Voyager pose.
 */

// ── Segment-4 exponential-zoom constants (derived so the beat opens on the Voyager
// rest pose, then flies out to frame the galaxy). Computed once, at module load. ──
const G_LOOK_START: [number, number, number] = [
  VOYAGER_POS[0] + LAB_CAM.look[0],
  VOYAGER_POS[1] + LAB_CAM.look[1],
  VOYAGER_POS[2] + LAB_CAM.look[2],
];
const _gCamStart = [
  VOYAGER_POS[0] + LAB_CAM.offset[0],
  VOYAGER_POS[1] + LAB_CAM.offset[1],
  VOYAGER_POS[2] + LAB_CAM.offset[2],
];
const _gStartVec = [
  _gCamStart[0] - G_LOOK_START[0],
  _gCamStart[1] - G_LOOK_START[1],
  _gCamStart[2] - G_LOOK_START[2],
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
    const fly = Math.pow(clamp01(voyage / VOYAGE.flyoutEnd), FLYOUT.ease);
    let px = lerp(a.x, 0, fly);
    let py = lerp(a.y, FLYOUT.rise, fly);
    let pz = lerp(a.z + CAMERA.z, CAMERA.z + FLYOUT.distance, fly);
    let lx = lerp(a.x, SUNPOS[0], fly);
    let ly = lerp(a.y, SUNPOS[1], fly);
    let lz = lerp(a.z, SUNPOS[2], fly);

    // ── Segment 2: wide → Earth dive (fly to the LIVE orbiting Earth) ──
    // easeInOutCubic → the camera eases out of the wide view and GLIDES TO REST
    // as the Earth fills the frame (velocity → 0 at arrival), so it settles
    // smoothly into the dwell instead of slamming to a stop.
    // The real-size Earth is tiny, so the distance to it closes as a steady ZOOM
    // (EARTH_CAM.steadyZoom): along the same straight path, the remaining distance
    // shrinks by the same factor each step instead of at a constant speed.
    const ap = remap01(voyage, VOYAGE.flyoutEnd, 1);
    if (ap > 0) {
      const apE = easeInOutCubic(ap);
      const e = useEarthAnchor.getState();
      const [ox, oy, oz] = EARTH_CAM.offset;
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
      // straight path would fly through it. Find where the path passes closest to the
      // Sun and, if that's nearer than sunClear, bend the path away from it there — in
      // ONE fixed direction (Sun → that point), by a smooth bump that is 0 at the start
      // and at the arrival — so the camera arcs past the Sun instead of swinging round it.
      const [sx, sy, sz] = flyingSunPos();
      const dx = bx - ax;
      const dy = by - ay;
      const dz = bz - az;
      const along = clamp01(((sx - ax) * dx + (sy - ay) * dy + (sz - az) * dz) / (dx * dx + dy * dy + dz * dz || 1));
      const cx = ax + dx * along - sx;
      const cy = ay + dy * along - sy;
      const cz = az + dz * along - sz;
      const closest = Math.hypot(cx, cy, cz);
      const clear = EARTH_CAM.sunClear;
      if (closest < clear && along > 0 && along < 1) {
        const inv = closest > 1e-3 ? 1 / closest : 0;
        const [nx, ny, nz] = closest > 1e-3 ? [cx * inv, cy * inv, cz * inv] : [0, 1, 0];
        // (u/along)^m · ((1−u)/(1−along))² — flat at the start, 1 at `along`, 0 on arrival.
        const bump =
          Math.pow(u / along, (2 * along) / (1 - along)) * Math.pow((1 - u) / (1 - along), 2);
        const lift = (clear - closest) * bump;
        px += nx * lift;
        py += ny * lift;
        pz += nz * lift;
      }
    }

    // ── Segment 3: one smooth fly from Earth straight to the readable Voyager
    // pose. voyage is clamped at 1 here (Earth-close pose from segment 2).
    // easeInOutCubic mirrors the Earth ARRIVAL: velocity is 0 at BOTH ends, so the
    // camera eases GENTLY out of the resting dwell (a soft leave, no abrupt launch)
    // and still glides to REST at the Voyager. Peak speed is unchanged — it just
    // sits mid-flight, so the dust rush still crests between the two, not at t=0.
    const lab = clamp01(useLabScroll.getState().progress);
    if (lab > 0) {
      const t = easeInOutCubic(lab);
      const v = useVoyagerAnchor.getState();
      px = lerp(px, v.x + LAB_CAM.offset[0], t);
      py = lerp(py, v.y + LAB_CAM.offset[1], t);
      pz = lerp(pz, v.z + LAB_CAM.offset[2], t);
      lx = lerp(lx, v.x + LAB_CAM.look[0], t);
      ly = lerp(ly, v.y + LAB_CAM.look[1], t);
      lz = lerp(lz, v.z + LAB_CAM.look[2], t);
    }

    // ── Segment 4: the finale — ONE exponential pull-out. At galaxy = 0 this
    // reproduces the segment-3 Voyager pose exactly (constants derived from LAB_CAM),
    // so it takes over seamlessly, then flies OUT: distance grows exponentially while
    // the aim pans Voyager → the (flying) Sun → the galaxy centre. Anchored on the
    // LIVE Sun position (`flyingSunPos`), so scrolling BACK zooms into the solar
    // system wherever it has flown to in the galaxy — not back to a fixed home.
    // A pure function of useGalaxyScroll (+ the live Sun) → reverses on scroll-up.
    const galaxy = clamp01(useGalaxyScroll.getState().progress);
    let framing = 0; // how much the galaxy framing applies (the leg-2 pan, below)
    // After landing: the gentle drift back before the Contact form (eased).
    const drift = easeInOutCubic(clamp01(useGalaxyScroll.getState().drift));
    const driftScale = 1 + (1 / (1 - GALAXY_ZOOM.driftBack) - 1) * drift;
    if (galaxy > 0) {
      const z = galaxy;
      const ps = GALAXY_ZOOM.panSunEnd;
      const sun = flyingSunPos();
      // Distance grows exponentially with raw z the whole beat (the prototype feel).
      const dist = G_D_START * Math.pow(G_Z_RATIO, z);
      if (z <= ps) {
        // Leg 1: aim pans Voyager → the (flying) Sun, framing the whole real system.
        // View dir holds the Voyager ¾ (smoothstep so it eases out of the rest pose).
        // The Voyager flies with the system, so its framing does too (`flyOffset`).
        const e = z / ps;
        const s = e * e * (3 - 2 * e);
        const [sx, sy, sz] = sun;
        const [ox, oy, oz] = flyOffset();
        lx = lerp(G_LOOK_START[0] + ox, sx, s);
        ly = lerp(G_LOOK_START[1] + oy, sy, s);
        lz = lerp(G_LOOK_START[2] + oz, sz, s);
        px = lx + G_START_DIR[0] * dist;
        py = ly + G_START_DIR[1] * dist;
        pz = lz + G_START_DIR[2] * dist;
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
        const d2 = (dist / Math.pow(GALAXY_ZOOM.endCloser, e)) * driftScale;
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
    frameGalaxy(camera as PerspectiveCamera, framing, driftScale);
    // Pin the starfield to the camera in the SAME frame the camera moves (this
    // rig runs last), so the stars sit at a constant distance and never lag — no
    // velocity-coupled size "pumping" as you scroll.
    starfieldRef.current?.position.copy(camera.position);
  });
  return null;
};

/**
 * While an overlay panel is open (Earth gallery or Lab experiments), lock the
 * journey to the panel: pause ScrollSmoother so the wheel/touch can't advance the
 * story, and disable pointer events on the canvas so drags/clicks don't fire
 * "space events" behind the panel. The panel (portalled outside #smooth-content)
 * keeps its own scroll + clicks. Everything restores when the panel closes.
 */
const InteractionLock = () => {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const apply = () => {
      const locked =
        useGalleryStore.getState().openId !== null ||
        useLabStore.getState().open;
      gl.domElement.style.pointerEvents = locked ? "none" : "auto";
      // Freeze the journey via the shared lock registry (stores/scrollLock) so
      // any lock source coordinates without clobbering ScrollSmoother.paused().
      setScrollLock("panel", locked);
    };
    apply();
    const unsubGallery = useGalleryStore.subscribe(apply);
    const unsubLab = useLabStore.subscribe(apply);
    return () => {
      unsubGallery();
      unsubLab();
      gl.domElement.style.pointerEvents = "auto";
      setScrollLock("panel", false);
    };
  }, [gl]);
  return null;
};

/**
 * Eases the Bloom intensity down as Saturn assembles: full glow through the
 * star + explosion, fading toward 0 by the time the planet has formed, so
 * Saturn reads as a crisp body of particles rather than a glowing blob.
 *
 * For the galaxy finale it ramps in the soft highlight roll-off over
 * `GALAXY_FX.fxIn` (the galaxy's reveal), so every earlier beat is untouched. (The
 * galaxy's bloom is its own — see galaxy/GalaxyBloom.) And it drives the Contact
 * veil (VeilPass), which is switched off entirely while there's nothing to veil.
 */
const BloomController = ({
  bloom,
  veil,
  highlightsRef,
}: {
  bloom: BloomEffect;
  veil: VeilPass;
  highlightsRef: RefObject<SoftHighlightsEffect | null>;
}) => {
  useFrame(() => {
    // The Contact veil (written by the journey). `contactDim` is a screen-value
    // brightness; the pass works in linear light.
    veil.veil = cosmicVeil.contact;
    veil.enabled = cosmicVeil.contact > 0.001; // not the last pass → safe to skip (no copy)
    veil.dim = Math.pow(JOURNEY.contactDim, 2.2);
    veil.spread = JOURNEY.contactBlur;
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
