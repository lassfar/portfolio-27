"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Points as ThreePoints } from "three";
import { STARFIELD, STARFIELD_COLOR } from "./config";

type Props = {
  count?: number;
  animate?: boolean;
};

/**
 * A field of stars distributed in a spherical shell around the camera.
 * Drifts slowly when `animate` is true (disabled for reduced-motion).
 */
const Starfield = ({ count = STARFIELD.count, animate = true }: Props) => {
  const pointsRef = useRef<ThreePoints>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = STARFIELD.minRadius + Math.random() * STARFIELD.radiusSpread;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = radius * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!animate || !pointsRef.current) return;
    pointsRef.current.rotation.y = state.clock.elapsedTime * 0.01;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={STARFIELD.size}
        sizeAttenuation
        color={STARFIELD_COLOR}
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
};

export default Starfield;
