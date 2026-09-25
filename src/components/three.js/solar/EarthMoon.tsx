"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group } from "three";
import { useSceneRotation } from "#/stores/useSceneRotation";
import { MOONS } from "./config";
import OrbitingMoon from "./OrbitingMoon";
import { ORBIT_PRIORITY } from "./planetTuning";
import { earthReveal } from "./reveal";

type Props = {
  animate?: boolean;
};

/**
 * The Earth's Moon — mounted inside the Earth's position group (EarthMember), in a
 * frame turned by the shared scene rotation like the rest of the system (the Earth's
 * own body isn't), so its orbit turns with a drag. It shows and fades with the Earth:
 * it stays through the dive and the close-up, and leaves with it in the Lab.
 */
const EarthMoon = ({ animate = true }: Props) => {
  const frameRef = useRef<Group>(null);

  useFrame(() => {
    const r = useSceneRotation.getState();
    frameRef.current?.rotation.set(r.pitch, r.yaw, 0);
  }, ORBIT_PRIORITY);

  return (
    <group ref={frameRef}>
      {MOONS.filter((m) => m.parent === "earth").map((moon) => (
        <OrbitingMoon key={moon.id} moon={moon} animate={animate} reveal={earthReveal} />
      ))}
    </group>
  );
};

export default EarthMoon;
