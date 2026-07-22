"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { ReactNode, RefObject, useRef } from "react";
import { Group } from "three";
import Universe from "#/components/three.js/star/Universe";
import { BLOOM, CAMERA, PARTICLES } from "#/components/three.js/star/config";
import { clamp01, damp, remap01 } from "#/components/three.js/star/utils";
import Planet from "#/components/three.js/planet/Planet";
import { FLYAWAY, PLANET, RING, SATURN } from "#/components/three.js/planet/config";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useVoyageScroll } from "#/stores/useVoyageScroll";

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

  return (
    <Canvas
      camera={{ position: [0, 0, CAMERA.z], fov: CAMERA.fov }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Starfield + star: drag-rotates, scroll zooms + bursts the star. */}
      <Universe animate={animate} count={starCount} />

      {/* Saturn — centred where the star bursts, scaled to the star camera.
          Hidden until the burst (opacity driven by the assembly progress).
          Drag stays with the star, so this one isn't interactive. The rig
          dollies it back + shrinks it during the fly-away (thinning lives in
          the body/ring shaders). */}
      <SaturnRig>
        <Planet
          animate={animate}
          interactive={false}
          planetCount={planetCount}
          ringCount={ringCount}
        />
      </SaturnRig>

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
      <CameraRig />
    </Canvas>
  );
};

export default CosmicScene;

/**
 * Holds the Saturn where the star bursts (centred, star-camera scale) and, as
 * the voyage begins, dollies it away from the camera (−z) and shrinks it — the
 * "zoom out / fly away." A pure function of `useVoyageScroll` (damped), so it
 * scrubs and reverses cleanly. The dot-thinning that pairs with this lives in
 * the body/ring shaders (uThin), also driven by the voyage.
 */
const SaturnRig = ({ children }: { children: ReactNode }) => {
  const groupRef = useRef<Group>(null);
  const z = useRef(0);
  const scale = useRef<number>(SATURN.scale);

  useFrame(() => {
    const g = groupRef.current;
    if (!g) return;
    const voyage = clamp01(useVoyageScroll.getState().progress);
    const eased = Math.pow(voyage, FLYAWAY.ease);
    const targetZ = -FLYAWAY.recede * eased;
    const targetScale = SATURN.scale * (1 - (1 - FLYAWAY.shrink) * eased);
    z.current = damp(z.current, targetZ, FLYAWAY.damping);
    scale.current = damp(scale.current, targetScale, FLYAWAY.damping);
    g.position.set(0, SATURN.y, z.current);
    g.scale.setScalar(scale.current);
  });

  return <group ref={groupRef}>{children}</group>;
};

/**
 * Pulls the camera back a little as the voyage begins — a real dolly, so the
 * whole scene "zooms out" with correct parallax: the near Saturn recedes fast
 * while the distant starfield barely shifts (it's meant to stay far). A small,
 * damped amount driven by `useVoyageScroll`; at rest it sits exactly at the
 * star camera distance, so the earlier journey is untouched.
 */
const CameraRig = () => {
  const camera = useThree((s) => s.camera);
  const z = useRef<number>(CAMERA.z);

  useFrame(() => {
    const voyage = clamp01(useVoyageScroll.getState().progress);
    const eased = Math.pow(voyage, FLYAWAY.ease);
    z.current = damp(z.current, CAMERA.z + FLYAWAY.sceneDolly * eased, FLYAWAY.damping);
    camera.position.z = z.current;
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
