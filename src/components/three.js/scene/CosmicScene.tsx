"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { ReactNode, RefObject, useRef } from "react";
import { Euler, Group, Vector3 } from "three";
import Universe from "#/components/three.js/star/Universe";
import { BLOOM, CAMERA, PARTICLES } from "#/components/three.js/star/config";
import { clamp01, lerp, remap01 } from "#/components/three.js/star/utils";
import Planet from "#/components/three.js/planet/Planet";
import { FLYOUT, PLANET, RING, SATURN } from "#/components/three.js/planet/config";
import SolarSystem from "#/components/three.js/solar/SolarSystem";
import {
  orbitPosition,
  SATURN_FLY,
  SATURN_ORBIT_PHASE0,
  SATURN_ORBIT_RADIUS,
  SOLAR,
  SUNPOS,
  VOYAGE,
} from "#/components/three.js/solar/config";
import DottedEarth from "#/components/three.js/earth/DottedEarth";
import { EARTH_CAM, EARTH_ORBIT } from "#/components/three.js/earth/config";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { useSceneRotation } from "#/stores/useSceneRotation";
import { useSaturnAnchor } from "#/stores/useSaturnAnchor";
import { useEarthAnchor } from "#/stores/useEarthAnchor";

type BloomEffect = { intensity: number };

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

  const bloomRef = useRef<BloomEffect>(null);
  // The starfield group — CameraRig pins it to the camera each frame (see below),
  // so it's shared between Universe (which rotates it) and CameraRig.
  const starfieldRef = useRef<Group>(null);

  return (
    <Canvas
      camera={{ position: [0, 0, CAMERA.z], fov: CAMERA.fov }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Starfield + star: drag-rotates, scroll zooms + bursts the star. */}
      <Universe animate={animate} count={starCount} starfieldRef={starfieldRef} />

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
      </EarthMember>

      <EffectComposer>
        <Bloom
          ref={bloomRef}
          intensity={BLOOM.intensity}
          luminanceThreshold={BLOOM.threshold}
          luminanceSmoothing={BLOOM.smoothing}
          radius={BLOOM.radius}
          mipmapBlur
        />
      </EffectComposer>

      <BloomController bloomRef={bloomRef} />
      <CameraRig starfieldRef={starfieldRef} />
    </Canvas>
  );
};

export default CosmicScene;

/**
 * The Saturn is a working member: it orbits the sun on its OWN (time-based),
 * never moved by scroll. Its orbit passes through the world origin, so during the
 * intro (voyage 0) the clock is held at 0 → it sits at the origin where the star
 * bursts and assembles, and the camera is at the star distance (untouched intro).
 * Once the voyage begins it orbits continuously; the clock resets at voyage 0
 * (invisible — the camera tracks it, the starfield follows the camera, and the
 * system is hidden there). Publishes its world position so the CameraRig can lock
 * onto it. Body pose + self-spin live in Planet.
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
  const clock = useRef(0);
  const offset = useRef(new Vector3());
  const rotated = useRef(new Vector3());
  const euler = useRef(new Euler());

  useFrame((_, delta) => {
    if (!posRef.current) return;
    const voyage = clamp01(useVoyageScroll.getState().progress);
    if (voyage <= 0.001) clock.current = 0;
    else clock.current += delta * SATURN_FLY.speed;

    // Orbital offset from the sun (local to the system, exactly like a sibling).
    const [ox, oy, oz] = orbitPosition(
      SATURN_ORBIT_RADIUS,
      SATURN_ORBIT_PHASE0 + clock.current
    );
    offset.current.set(ox, oy, oz);

    // Same offset turned by the shared scene rotation (matches SolarSystem's
    // group transform), then blended from unrotated → rotated over voyage start
    // so the origin stays fixed during the intro.
    const r = useSceneRotation.getState();
    rotated.current
      .copy(offset.current)
      .applyEuler(euler.current.set(r.pitch, r.yaw, 0));
    const blend = clamp01(voyage / SOLAR.revealStart);

    const wx = SUNPOS[0] + lerp(ox, rotated.current.x, blend);
    const wy = SUNPOS[1] + lerp(oy, rotated.current.y, blend);
    const wz = SUNPOS[2] + lerp(oz, rotated.current.z, blend);
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
 * Earth as a normal member of the solar system: it orbits the sun continuously on
 * its own place (EARTH_ORBIT), turned by the shared scene rotation exactly like
 * the sibling planets. It never grows or transitions — it just publishes its live
 * world position to `useEarthAnchor` so the CameraRig can fly to it and track it.
 * Body (dots), self-spin and drag live in DottedEarth.
 */
const EarthMember = ({ children }: { children: ReactNode }) => {
  const posRef = useRef<Group>(null);
  const offset = useRef(new Vector3());
  const euler = useRef(new Euler());

  useFrame((state) => {
    if (!posRef.current) return;
    const t = state.clock.getElapsedTime();
    const [ox, oy, oz] = orbitPosition(
      EARTH_ORBIT.radius,
      EARTH_ORBIT.phase + t * EARTH_ORBIT.speed
    );
    // Turn the orbital offset by the shared scene rotation (matches the siblings),
    // then place it relative to the sun.
    const r = useSceneRotation.getState();
    offset.current.set(ox, oy, oz).applyEuler(euler.current.set(r.pitch, r.yaw, 0));
    const wx = SUNPOS[0] + offset.current.x;
    const wy = SUNPOS[1] + offset.current.y;
    const wz = SUNPOS[2] + offset.current.z;
    posRef.current.position.set(wx, wy, wz);
    useEarthAnchor.getState().set(wx, wy, wz);
  });

  return <group ref={posRef}>{children}</group>;
};

/**
 * The camera does ALL the scroll work, in two segments over the voyage:
 *
 *   1. Saturn → wide  (voyage 0 … VOYAGE.flyoutEnd): starts LOCKED ONTO the
 *      Saturn (the About close-up) and flies OUT — up + back — easing its aim to
 *      the SUN, settling on the wide sun-centred system.
 *   2. wide → Earth   (voyage VOYAGE.flyoutEnd … 1): dives from the wide view
 *      onto the Earth — a normal member orbiting the sun on its own place — by
 *      tracking its LIVE position (useEarthAnchor), so it fills the view by
 *      perspective (never by growing) while the rest of the system fades.
 *
 * A pure (eased) function of `useVoyageScroll` + the Saturn's live position, so
 * it reverses perfectly on scroll-up.
 */
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
    const ap = remap01(voyage, VOYAGE.flyoutEnd, 1);
    if (ap > 0) {
      const apE = Math.pow(ap, EARTH_CAM.ease);
      const e = useEarthAnchor.getState();
      px = lerp(px, e.x + EARTH_CAM.offset[0], apE);
      py = lerp(py, e.y + EARTH_CAM.offset[1], apE);
      pz = lerp(pz, e.z + EARTH_CAM.offset[2], apE);
      lx = lerp(lx, e.x, apE);
      ly = lerp(ly, e.y, apE);
      lz = lerp(lz, e.z, apE);
    }

    camera.position.set(px, py, pz);
    camera.lookAt(lx, ly, lz);
    // Pin the starfield to the camera in the SAME frame the camera moves (this
    // rig runs last), so the stars sit at a constant distance and never lag — no
    // velocity-coupled size "pumping" as you scroll.
    starfieldRef.current?.position.copy(camera.position);
  });
  return null;
};

/**
 * Eases the Bloom intensity down as Saturn assembles: full glow through the
 * star + explosion, fading toward 0 by the time the planet has formed, so
 * Saturn reads as a crisp body of particles rather than a glowing blob.
 */
const BloomController = ({
  bloomRef,
}: {
  bloomRef: RefObject<BloomEffect | null>;
}) => {
  useFrame(() => {
    if (!bloomRef.current) return;
    const progress = useAboutScroll.getState().progress;
    bloomRef.current.intensity =
      BLOOM.intensity * (1 - remap01(progress, 0.05, 0.6));
  });
  return null;
};
