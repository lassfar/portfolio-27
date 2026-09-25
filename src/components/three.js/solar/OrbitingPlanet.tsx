"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { MOONS, PlanetDef, SOLAR_MOTION } from "./config";
import DottedBody from "./DottedBody";
import OrbitingMoon from "./OrbitingMoon";
import { orbitPositionAt, systemTime } from "./orbits";
import { ORBIT_PRIORITY } from "./planetTuning";
import { siblingReveal } from "./reveal";

type Props = {
  def: PlanetDef;
  animate?: boolean;
};

/**
 * One sibling planet on its real orbit (see orbits.ts: its real oval and tilt,
 * starting where it really is today, at Kepler's pace), spinning at its real day
 * length, with its moons riding its equator (Jupiter's four). The body itself is a
 * DottedBody. Fades with the system (in with it, out for the Earth dive, back for the
 * finale).
 */
const OrbitingPlanet = ({ def, animate = true }: Props) => {
  const orbitRef = useRef<Group>(null);

  useFrame((state) => {
    if (!orbitRef.current) return;
    const t = systemTime(state.clock.elapsedTime, useVoyageScroll.getState().progress);
    orbitPositionAt(def.orbit, t, orbitRef.current.position);
  }, ORBIT_PRIORITY);

  return (
    <group ref={orbitRef}>
      <DottedBody
        body={def}
        animate={animate}
        reveal={siblingReveal}
        spinRate={() => SOLAR_MOTION.dayPace / def.day}
      >
        {MOONS.filter((m) => m.parent === def.id).map((moon) => (
          <OrbitingMoon key={moon.id} moon={moon} animate={animate} reveal={siblingReveal} />
        ))}
      </DottedBody>
    </group>
  );
};

export default OrbitingPlanet;
