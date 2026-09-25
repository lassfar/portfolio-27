"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { MoonDef } from "./config";
import DottedBody from "./DottedBody";
import { moonLongitudeAt, moonPositionAt, systemTime } from "./orbits";
import { ORBIT_PRIORITY } from "./planetTuning";

type Props = {
  moon: MoonDef;
  animate: boolean;
  /** Its visibility (0..1) — its planet's. */
  reveal: () => number;
};

/**
 * A moon circling its planet (placed in the planet's frame by the parent): starting
 * where it really is today, at its real period on its system's pace. Tidally locked —
 * its spin follows its orbit, so the same face always points at its planet.
 */
const OrbitingMoon = ({ moon, animate, reveal }: Props) => {
  const orbitRef = useRef<Group>(null);
  const time = useRef(0);

  useFrame((state) => {
    time.current = systemTime(state.clock.elapsedTime, useVoyageScroll.getState().progress);
    if (orbitRef.current) moonPositionAt(moon, time.current, orbitRef.current.position);
  }, ORBIT_PRIORITY);

  return (
    <group ref={orbitRef}>
      <DottedBody
        body={moon}
        animate={animate}
        reveal={reveal}
        spinAngle={() => moonLongitudeAt(moon, time.current)}
      />
    </group>
  );
};

export default OrbitingMoon;
