"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Float32BufferAttribute, Group, LineBasicMaterial, LineLoop } from "three";
import { useSceneRotation } from "#/stores/useSceneRotation";
import Sun from "./Sun";
import OrbitingPlanet from "./OrbitingPlanet";
import AsteroidBelt from "./AsteroidBelt";
import { EARTH_ELEMENTS, PLANETS, SATURN_ORBIT_RADIUS, SOLAR, SUNPOS } from "./config";
import { circleOutline, orbitOutline } from "./orbits";
import { ORBIT_PRIORITY, usePlanetTuning } from "./planetTuning";
import { siblingReveal } from "./reveal";
import { flyingSunPos } from "#/components/three.js/galaxy/spin";

type Props = {
  animate?: boolean;
};

/**
 * The solar system the Saturn belongs to — the sun blazing at the centre and the
 * planets on their real orbits around it (see orbits.ts), with the asteroid belt
 * between Mars and Jupiter. Everything hangs off a pivot at the sun with a rotation
 * group that mirrors the SHARED space rotation (`useSceneRotation`, driven by the
 * star's drag) — so dragging turns the whole cosmos, starfield + solar system,
 * together as one (not an independent spin). The Saturn and the Earth are placed by
 * their own members (CosmicScene); their orbit lines are drawn here.
 *
 * The camera flies back to reveal it; the bodies fade in over the reveal window
 * (`useVoyageScroll`) and move on the system's clock (`systemTime`).
 */
const SolarSystem = ({ animate = true }: Props) => {
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
  }, ORBIT_PRIORITY);

  return (
    <group ref={sysRef} position={SUNPOS}>
      <group ref={rotRef}>
        <Sun animate={animate} />

        {/* The orbit lines — the real ovals (shown while SOLAR.ring.visible). */}
        {PLANETS.map((def) => (
          <OrbitRing key={`ring-${def.id}`} outline={() => orbitOutline(def.orbit, SOLAR.ring.segments)} />
        ))}
        <OrbitRing outline={() => orbitOutline(EARTH_ELEMENTS, SOLAR.ring.segments)} />
        {/* The Saturn's: the fixed circle through the origin (see SaturnMember). */}
        <OrbitRing outline={() => circleOutline(SATURN_ORBIT_RADIUS, SOLAR.ring.segments)} />

        <AsteroidBelt />

        {PLANETS.map((def) => (
          <OrbitingPlanet key={def.id} def={def} animate={animate} />
        ))}
      </group>
    </group>
  );
};

export default SolarSystem;

/**
 * A faint orbit line (local to the sun pivot), fading with the sibling planets. Shown
 * while `SOLAR.ring.visible`; its colour + opacity are live, and its shape rebuilds
 * when the dev panel changes an orbit.
 */
const OrbitRing = ({ outline }: { outline: () => Float32Array }) => {
  const lineRef = useRef<LineLoop>(null);
  const matRef = useRef<LineBasicMaterial>(null);
  const version = usePlanetTuning((s) => s.version);

  const geometry = useMemo(() => {
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(outline(), 3));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` rebuilds from the tuned orbits
  }, [version]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    if (lineRef.current) lineRef.current.visible = SOLAR.ring.visible;
    if (!matRef.current || !SOLAR.ring.visible) return;
    matRef.current.color.set(SOLAR.ring.color);
    matRef.current.opacity = SOLAR.ring.opacity * siblingReveal();
  });

  return (
    <lineLoop ref={lineRef} geometry={geometry}>
      <lineBasicMaterial ref={matRef} color={SOLAR.ring.color} transparent opacity={0} depthWrite={false} />
    </lineLoop>
  );
};
