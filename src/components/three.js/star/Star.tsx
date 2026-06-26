"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, CanvasTexture, Group } from "three";

type Props = {
  animate?: boolean;
};

/**
 * The hero star: a small bright core with a soft, edgeless radial glow.
 * The glow is a camera-facing sprite using a radial-gradient texture (no hard
 * sphere silhouette), and the core is bright + `toneMapped={false}` so the
 * Bloom pass blooms it into light. Gently breathes when `animate` is true.
 */
const Star = ({ animate = true }: Props) => {
  const groupRef = useRef<Group>(null);

  // Soft radial glow: white-hot center → warm peach → transparent edge.
  const glowTexture = useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(
        size / 2,
        size / 2,
        0,
        size / 2,
        size / 2,
        size / 2
      );
      g.addColorStop(0, "rgba(255, 255, 255, 1)");
      g.addColorStop(0.22, "rgba(255,244,230,0.65)");
      g.addColorStop(0.5, "rgba(255,161,74,0.3)");
      g.addColorStop(1, "rgba(255,161,74,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    }
    return new CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (!animate || !groupRef.current) return;
    const t = state.clock.elapsedTime;
    groupRef.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.03);
  });

  return (
    <group ref={groupRef} position={[0, 1.9, 0]}>
      {/* Soft glow halo — edgeless, faces the camera */}
      <sprite scale={[2.8, 2.8, 1]}>
        <spriteMaterial
          map={glowTexture}
          transparent
          opacity={0.95}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      {/* Bright core */}
      <mesh>
        <sphereGeometry args={[0.42, 64, 64]} />
        <meshBasicMaterial color="#fff6ec" toneMapped={false} />
      </mesh>
    </group>
  );
};

export default Star;
