"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Group } from "three";
import Nebula from "./Nebula";
import Starfield from "./Starfield";
import { LAYOUT, ROTATION, SCREEN_FILL_SCALE, ZOOM } from "./config";
import { damp, remap01 } from "./utils";
import { useHeroScroll } from "#/stores/useHeroScroll";

type Props = {
  animate?: boolean;
  count?: number;
};

/**
 * The hero universe: a fixed starfield plus the particle nebula-star.
 *
 * Rotation — pointer-drag (and idle drift) rotates BOTH the starfield and the
 * nebula around the star's center, free and unlimited, damped.
 *
 * Scroll zoom — reads the shared hero scroll progress and centers + grows the
 * nebula, then (once it has burst, see Nebula.tsx) dollies it through the camera
 * so it flies into the lens and vanishes. Only the nebula transforms, so the
 * starfield stays fixed. All timing/feel constants live in `config.ts`.
 */
const Universe = ({ animate = true, count }: Props) => {
  const starfieldRotRef = useRef<Group>(null);
  const nebulaZoomRef = useRef<Group>(null);
  const nebulaSpinRef = useRef<Group>(null);

  // Drag-rotation state.
  const targetRot = useRef({ x: 0, y: 0 });
  const currentRot = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const gl = useThree((state) => state.gl);

  // Smoothed zoom state.
  const zoomScale = useRef(1);
  const zoomY = useRef<number>(LAYOUT.starY);
  const zoomZ = useRef(0);

  useEffect(() => {
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
  }, [gl]);

  useFrame((_, delta) => {
    // ── Rotation (drag + idle drift) → starfield and nebula spin together ──
    if (animate) targetRot.current.y += delta * ROTATION.idleDrift;
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
    if (starfieldRotRef.current) {
      starfieldRotRef.current.rotation.x = currentRot.current.x;
      starfieldRotRef.current.rotation.y = currentRot.current.y;
    }
    if (nebulaSpinRef.current) {
      nebulaSpinRef.current.rotation.x = currentRot.current.x;
      nebulaSpinRef.current.rotation.y = currentRot.current.y;
    }

    // ── Scroll zoom: center → grow → fly through camera (the burst itself
    //    lives in the nebula's shader) ──
    const progress = useHeroScroll.getState().progress;

    const centering = remap01(progress, ZOOM.centerStart, ZOOM.centerEnd);
    const targetY = LAYOUT.starY * (1 - centering);

    // Grow continuously (ease-in) until the star's visible height equals the
    // viewport height exactly at growEnd — the instant it bursts. No hold.
    const growth = remap01(progress, ZOOM.growStart, ZOOM.growEnd);
    const targetScale = 1 + growth * growth * (SCREEN_FILL_SCALE - 1);

    const flying = remap01(progress, ZOOM.flyStart, 1);
    const targetZ = flying * flying * ZOOM.flyDistance;

    zoomScale.current = damp(zoomScale.current, targetScale, ZOOM.damping);
    zoomY.current = damp(zoomY.current, targetY, ZOOM.damping);
    zoomZ.current = damp(zoomZ.current, targetZ, ZOOM.damping);
    if (nebulaZoomRef.current) {
      nebulaZoomRef.current.scale.setScalar(zoomScale.current);
      nebulaZoomRef.current.position.set(0, zoomY.current, zoomZ.current);
    }
  });

  return (
    <>
      {/* Fixed starfield — rotates around the star center, never zooms */}
      <group ref={starfieldRotRef} position={[0, LAYOUT.starY, 0]}>
        <group position={[0, -LAYOUT.starY, 0]}>
          <Starfield animate={false} />
        </group>
      </group>

      {/* Nebula — zoomed by scroll, spun by drag, bursts in its own shader */}
      <group ref={nebulaZoomRef} position={[0, LAYOUT.starY, 0]}>
        <group ref={nebulaSpinRef}>
          <Nebula count={count} animate={animate} />
        </group>
      </group>
    </>
  );
};

export default Universe;
