"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Group } from "three";
import Nebula from "./Nebula";
import Starfield from "./Starfield";
import { JOURNEY, LAYOUT, ROTATION, SCREEN_FILL_SCALE, ZOOM } from "./config";
import { damp, remap01 } from "./utils";
import { useHeroScroll } from "#/stores/useHeroScroll";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useSceneRotation } from "#/stores/useSceneRotation";
import { useSceneIntro } from "#/stores/useSceneIntro";

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

  // Smoothed scroll-driven rotation (glides toward the scroll target).
  const scrollYaw = useRef(0);

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
      // Horizontal (yaw) always; vertical (pitch) only when enabled in config.
      targetRot.current.y += dx * ROTATION.sensitivity;
      if (ROTATION.allowVerticalDrag) {
        targetRot.current.x += dy * ROTATION.sensitivity;
      }
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

    // One-time intro spin (horizontal). Its progress + easing are driven by the
    // Hero's text-intro timeline (full speed immediately, finishing together).
    const introYaw =
      useSceneIntro.getState().progress * JOURNEY.introTurns * Math.PI * 2;

    // Scroll-driven horizontal rotation: a full turn over the star, another
    // over the planet assembly (reuses both scroll stores). All amounts live in
    // config.JOURNEY so they're easy to tune. Damped so it glides toward the
    // scroll position rather than snapping to it.
    const starP = useHeroScroll.getState().progress;
    const aboutP = useAboutScroll.getState().progress;
    const targetScrollYaw =
      (starP * JOURNEY.scrollTurnsStar + aboutP * JOURNEY.scrollTurnsPlanet) *
      Math.PI *
      2;
    scrollYaw.current = damp(
      scrollYaw.current,
      targetScrollYaw,
      JOURNEY.scrollSpinDamping
    );

    // Total horizontal rotation = drag + idle drift (damped) + intro + scroll.
    const yaw = currentRot.current.y + introYaw + scrollYaw.current;

    if (starfieldRotRef.current) {
      starfieldRotRef.current.rotation.x = currentRot.current.x;
      starfieldRotRef.current.rotation.y = yaw;
    }
    if (nebulaSpinRef.current) {
      nebulaSpinRef.current.rotation.x = currentRot.current.x;
      nebulaSpinRef.current.rotation.y = yaw;
    }

    // Publish the scene rotation so the (non-interactive) Saturn mirrors it and
    // the whole cosmos turns together (intro + scroll + drag).
    useSceneRotation.getState().setRotation(currentRot.current.x, yaw);

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
