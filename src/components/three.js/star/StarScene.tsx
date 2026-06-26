"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import Universe from "./Universe";
import { BLOOM, CAMERA, PARTICLES } from "./config";

/**
 * The Hero's 3D scene: a particle nebula-star anchored above a drifting,
 * draggable starfield, with a Bloom pass that turns the dense core into light.
 * Meant to be mounted in a full-bleed, absolutely-positioned container behind
 * the Hero content.
 *
 * Lazy-load this with `next/dynamic({ ssr: false })` — it is WebGL-only.
 */
const StarScene = () => {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = !prefersReduced;

  // Adaptive particle count: fewer on small / low-power screens.
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const particleCount = isSmall ? PARTICLES.countMobile : PARTICLES.count;

  return (
    <Canvas
      camera={{ position: [0, 0, CAMERA.z], fov: CAMERA.fov }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      {/* Starfield + nebula: drag-rotates around the star, scroll zooms the star. */}
      <Universe animate={animate} count={particleCount} />

      <EffectComposer>
        <Bloom
          intensity={BLOOM.intensity}
          luminanceThreshold={BLOOM.threshold}
          luminanceSmoothing={BLOOM.smoothing}
          radius={BLOOM.radius}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
};

export default StarScene;
