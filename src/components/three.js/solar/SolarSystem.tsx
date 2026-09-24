"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Group, LineBasicMaterial, LineLoop } from "three";
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
  SUNPOS,
  VOYAGE,
} from "./config";
import { finaleFarFade, finaleReturn } from "./reveal";
import { flyingSunPos } from "#/components/three.js/galaxy/spin";

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

  const sysRef = useRef<Group>(null);
  const rotRef = useRef<Group>(null);
  useFrame(() => {
    if (rotRef.current) {
      const r = useSceneRotation.getState();
      rotRef.current.rotation.set(r.pitch, r.yaw, 0);
    }
    // The Sun's live position — SUNPOS normally, revolving about the galactic centre
    // for the finale so the whole system flies through the galaxy in its arm.
    if (sysRef.current) {
      const sun = flyingSunPos();
      sysRef.current.position.set(sun[0], sun[1], sun[2]);
    }
  });

  return (
    <group ref={sysRef} position={SUNPOS}>
      <group ref={rotRef}>
        <Sun animate={animate} />

        {/* The orbit lines — shown while SOLAR.ring.visible (live, see OrbitRing). */}
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
 * system over the reveal window. Shown while `SOLAR.ring.visible`; its colour +
 * opacity are live too (the dev panel tunes them).
 */
const OrbitRing = ({ radius }: { radius: number }) => {
  const lineRef = useRef<LineLoop>(null);
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
    if (lineRef.current) lineRef.current.visible = SOLAR.ring.visible;
    if (!matRef.current || !SOLAR.ring.visible) return;
    matRef.current.color.set(SOLAR.ring.color);
    const voyage = useVoyageScroll.getState().progress;
    const earthFade = remap01(voyage, VOYAGE.earthFadeStart, VOYAGE.earthFadeEnd);
    const reveal =
      easeOutCubic(remap01(voyage, SOLAR.revealStart, SOLAR.revealEnd)) *
      (1 - earthFade * (1 - finaleReturn()));
    matRef.current.opacity = SOLAR.ring.opacity * reveal * finaleFarFade();
  });

  return (
    <lineLoop ref={lineRef}>
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
