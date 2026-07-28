"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, LineBasicMaterial } from "three";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { useSceneRotation } from "#/stores/useSceneRotation";
import { easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import Sun from "./Sun";
import OrbitingPlanet from "./OrbitingPlanet";
import { EARTH_ORBIT } from "#/components/three.js/earth/config";
import {
  orbitPosition,
  PLANETS,
  SOLAR,
  SOLAR_MOBILE_SCALE,
  SUN,
  SUNPOS,
  VOYAGE,
} from "./config";

type Props = {
  animate?: boolean;
};

/**
 * The solar system the Saturn belongs to — the sun blazing at the centre and the
 * sibling planets orbiting it on a near edge-on plane. Everything hangs off a
 * pivot at the sun with a rotation group that mirrors the SHARED space rotation
 * (`useSceneRotation`, driven by the star's drag) — so dragging turns the whole
 * cosmos, starfield + solar system, together as one (not an independent spin).
 *
 * The camera flies back to reveal it; the bodies fade in over the reveal window
 * (`useVoyageScroll`) and the orbits run continuously on the real-time clock.
 */
const SolarSystem = ({ animate = true }: Props) => {
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const scaleCount = (n: number) =>
    isSmall ? Math.round(n * SOLAR_MOBILE_SCALE) : n;
  const sunCount = isSmall ? SUN.countMobile : SUN.count;

  const rotRef = useRef<Group>(null);
  useFrame(() => {
    if (!rotRef.current) return;
    const r = useSceneRotation.getState();
    rotRef.current.rotation.set(r.pitch, r.yaw, 0);
  });

  return (
    <group position={SUNPOS}>
      <group ref={rotRef}>
        <Sun count={sunCount} animate={animate} />

        {PLANETS.map((def) => (
          <OrbitRing key={`ring-${def.id}`} radius={def.radius} />
        ))}
        {/* Earth's own orbit line (Earth itself is the EarthMember, not a sibling). */}
        <OrbitRing radius={EARTH_ORBIT.radius} />

        {PLANETS.map((def) => (
          <OrbitingPlanet
            key={def.id}
            def={def}
            count={scaleCount(def.count)}
            animate={animate}
          />
        ))}
      </group>
    </group>
  );
};

export default SolarSystem;

/**
 * A faint circular guide-ring (local to the sun pivot), fading in with the
 * system over the reveal window.
 */
const OrbitRing = ({ radius }: { radius: number }) => {
  const matRef = useRef<LineBasicMaterial>(null);

  const positions = useMemo(() => {
    const seg = SOLAR.ring.segments;
    const arr = new Float32Array(seg * 3);
    for (let i = 0; i < seg; i++) {
      const [x, y, z] = orbitPosition(radius, (i / seg) * Math.PI * 2);
      arr[i * 3] = x;
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    return arr;
  }, [radius]);

  useFrame(() => {
    if (!matRef.current) return;
    const voyage = useVoyageScroll.getState().progress;
    const earthFade = remap01(voyage, VOYAGE.earthFadeStart, VOYAGE.earthFadeEnd);
    const reveal =
      easeOutCubic(remap01(voyage, SOLAR.revealStart, SOLAR.revealEnd)) * (1 - earthFade);
    matRef.current.opacity = SOLAR.ring.opacity * reveal;
  });

  return (
    <lineLoop>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        ref={matRef}
        color={SOLAR.ring.color}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </lineLoop>
  );
};
