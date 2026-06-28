"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Group } from "three";
import { damp } from "#/components/three.js/star/utils";
import { useSceneRotation } from "#/stores/useSceneRotation";
import PlanetBody from "./PlanetBody";
import Rings from "./Rings";
import { PLANET, RING, ROTATION, TILT } from "./config";

type Props = {
  animate?: boolean;
  planetCount?: number;
  ringCount?: number;
  /** Attach the pointer-drag handler. Off in the shared scene (the star owns drag). */
  interactive?: boolean;
};

/**
 * The About "planet" — a brand-tinted Saturn built from particles.
 *
 * This is the orchestrator (like the star's `Universe`): it owns the rotation
 * and composes the two particle objects — `PlanetBody` and `Rings` — inside a
 * group hierarchy:
 *
 *   dragGroup   ← free pointer-orbit of the whole planet in view (damped)
 *     └ tilt    ← fixed axial tilt (the canted, ringed silhouette)
 *        └ spin ← gentle self-rotation on the planet's own axis
 *
 * Each child advances its own shader time; here we only handle rotation. All
 * timing / feel constants live in `config.ts`.
 */
const Planet = ({
  animate = true,
  planetCount = PLANET.count,
  ringCount = RING.count,
  interactive = true,
}: Props) => {
  const dragGroupRef = useRef<Group>(null);
  const spinGroupRef = useRef<Group>(null);

  const gl = useThree((state) => state.gl);

  // Drag-rotation state (free orbit of the whole planet in view).
  const targetRot = useRef({ x: 0, y: 0 });
  const currentRot = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!interactive) return;
    const el = gl.domElement;
    el.style.cursor = "grab";

    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      // Accumulate freely — no clamp → unlimited rotation in any direction.
      targetRot.current.y += dx * ROTATION.sensitivity;
      targetRot.current.x += dy * ROTATION.sensitivity;
    };
    const onUp = () => {
      dragging.current = false;
      el.style.cursor = "grab";
    };

    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl, interactive]);

  useFrame((_, delta) => {
    // Gentle self-rotation on the planet's own (tilted) axis.
    if (animate && spinGroupRef.current) {
      spinGroupRef.current.rotation.y += delta * ROTATION.idleSpin;
    }

    if (interactive) {
      // Standalone: damp this planet's own drag toward its accumulated target.
      currentRot.current.x = damp(
        currentRot.current.x,
        targetRot.current.x,
        ROTATION.damping
      );
      currentRot.current.y = damp(
        currentRot.current.y,
        targetRot.current.y,
        ROTATION.damping
      );
    } else {
      // Shared scene: mirror the star's published rotation so the planet turns
      // together with the starfield under one drag.
      const r = useSceneRotation.getState();
      currentRot.current.x = r.x;
      currentRot.current.y = r.y;
    }
    if (dragGroupRef.current) {
      dragGroupRef.current.rotation.x = currentRot.current.x;
      dragGroupRef.current.rotation.y = currentRot.current.y;
    }
  });

  return (
    // Drag orbits the whole planet; tilt is fixed; spin is on the axis.
    <group ref={dragGroupRef}>
      <group rotation={[TILT.x, 0, TILT.z]}>
        <group ref={spinGroupRef}>
          <PlanetBody count={planetCount} animate={animate} />
          <Rings count={ringCount} animate={animate} />
        </group>
      </group>
    </group>
  );
};

export default Planet;
