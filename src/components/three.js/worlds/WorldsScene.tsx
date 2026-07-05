"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useRef } from "react";
import { DoubleSide, Group } from "three";
import Planet from "./Planet";
import Sun from "./Sun";
import { CAMERA, MOTION, ORBIT_PATH, PLANETS } from "./config";

/**
 * The Photography "worlds in orbit" scene: a solid, glowing Sun at the centre
 * with the real planets orbiting it on a near-top-down, slowly revolving plane —
 * each a HYBRID world (solid sun-lit sphere + particle atmosphere, Saturn
 * ringed). Faint orbit-path rings trace each planet's circle. WebGL-only —
 * lazy-load with `next/dynamic({ ssr: false })`.
 *
 * Pass 1: the solar system is fully visible and revolving. Pass 2 adds
 * click-to-open → named photo panel per planet (Earth stays reserved).
 */
const WorldsScene = () => {
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const animate = !prefersReduced;

  return (
    <Canvas
      camera={{
        position: [0, 0, CAMERA.z],
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
      }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <Sun animate={animate} />
      <SolarSystem animate={animate} />

      <EffectComposer>
        <Bloom
          intensity={0.8}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.9}
          radius={0.7}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
};

export default WorldsScene;

/** The planets orbiting the Sun on a tilted, slowly revolving plane. */
const SolarSystem = ({ animate }: { animate: boolean }) => {
  const revolveRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (animate && revolveRef.current) {
      revolveRef.current.rotation.y += delta * MOTION.orbitSpeed;
    }
  });

  return (
    // Tilt the orbital plane toward the camera (near top-down); the paths stay
    // fixed while the planets revolve inside.
    <group rotation={[MOTION.orbitTilt, 0, 0]}>
      <OrbitPaths />
      <group ref={revolveRef}>
        {PLANETS.map((planet, i) => {
          // Spread the planets around their orbits so none overlap in view.
          const angle = (i / PLANETS.length) * Math.PI * 2;
          return (
            <group
              key={planet.id}
              position={[
                Math.cos(angle) * planet.orbit,
                0,
                Math.sin(angle) * planet.orbit,
              ]}
            >
              <Planet config={planet} animate={animate} />
            </group>
          );
        })}
      </group>
    </group>
  );
};

/** A faint ring drawn at each planet's orbital radius, in the orbit plane. */
const OrbitPaths = () => (
  <>
    {PLANETS.map((planet) => (
      // renderOrder -1 → always drawn first, behind the planets, in a stable
      // order so the faint coplanar rings never thrash the transparent sort.
      <mesh key={planet.id} rotation={[-Math.PI / 2, 0, 0]} renderOrder={-1}>
        <ringGeometry
          args={[
            planet.orbit - ORBIT_PATH.width,
            planet.orbit + ORBIT_PATH.width,
            160,
          ]}
        />
        <meshBasicMaterial
          color={ORBIT_PATH.color}
          transparent
          opacity={ORBIT_PATH.opacity}
          depthWrite={false}
          depthTest={false}
          side={DoubleSide}
        />
      </mesh>
    ))}
  </>
);
