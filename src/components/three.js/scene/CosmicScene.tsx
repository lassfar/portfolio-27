"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { RefObject, useRef } from "react";
import Universe from "#/components/three.js/star/Universe";
import { BLOOM, CAMERA, PARTICLES } from "#/components/three.js/star/config";
import { remap01 } from "#/components/three.js/star/utils";
import Planet from "#/components/three.js/planet/Planet";
import { PLANET, RING, SATURN } from "#/components/three.js/planet/config";
import { useAboutScroll } from "#/stores/useAboutScroll";

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
          Drag stays with the star, so this one isn't interactive. */}
      <group position={[0, SATURN.y, 0]} scale={SATURN.scale}>
        <Planet
          animate={animate}
          interactive={false}
          planetCount={planetCount}
          ringCount={ringCount}
        />
      </group>

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
    </Canvas>
  );
};

export default CosmicScene;

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
