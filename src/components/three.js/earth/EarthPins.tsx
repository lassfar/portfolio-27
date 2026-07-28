"use client";

import { ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  Group,
  Quaternion,
  SpriteMaterial,
  Vector3,
} from "three";
import { clamp01, damp, remap01 } from "#/components/three.js/star/utils";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { useEarthAnchor } from "#/stores/useEarthAnchor";
import { useGalleryStore } from "#/stores/useGalleryStore";
import { VOYAGE } from "#/components/three.js/solar/config";
import { EARTH } from "./config";
import { PHOTO_LOCATIONS, type PhotoLocation } from "./data";
import { latLngToVector3 } from "./utils";

const UP = new Vector3(0, 1, 0);

// Stick proportions, relative to the globe radius — small + delicate.
const STEM_LEN = EARTH.radius * 0.1; // how far the pin stands off the surface
const STEM_RADIUS = EARTH.radius * 0.003; // thin needle
const HEAD_RADIUS = EARTH.radius * 0.011; // tiny bead at the tip
const GLOW_SIZE = EARTH.radius * 0.085; // soft halo around the bead

/** Peach radial-gradient sprite used for every pin head's soft halo. */
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0.0, "rgba(255,161,74,0.95)");
    g.addColorStop(0.4, "rgba(255,161,74,0.35)");
    g.addColorStop(1.0, "rgba(255,161,74,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(c);
}

/**
 * The geo photo-pins — one per place at its true lat/lng, rendered as a map-pin
 * STICK that stands radially off the globe (a thin stem + a glowing head). They
 * live inside the Earth's spin group (so they stick to the geography as it
 * turns), appear only once the Earth is the focus, hide on the back hemisphere,
 * grow + glow on hover, and open that place's gallery on click.
 */
const EarthPins = () => {
  const glow = useMemo(makeGlowTexture, []);
  return (
    <group>
      {PHOTO_LOCATIONS.map((loc, i) => (
        <Pin key={loc.id} loc={loc} phase={i * 1.7} glow={glow} />
      ))}
    </group>
  );
};

export default EarthPins;

const Pin = ({
  loc,
  phase,
  glow,
}: {
  loc: PhotoLocation;
  phase: number;
  glow: CanvasTexture;
}) => {
  const camera = useThree((s) => s.camera);
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const glowRef = useRef<SpriteMaterial>(null);
  const scale = useRef(1);
  const [hovered, setHovered] = useState(false);

  const worldPos = useRef(new Vector3());
  const normal = useRef(new Vector3());
  const viewDir = useRef(new Vector3());

  // Base on the surface, oriented so the stem points radially OUTWARD.
  const { pos, quat } = useMemo(() => {
    const p = latLngToVector3(loc.lat, loc.lng, EARTH.radius);
    const q = new Quaternion().setFromUnitVectors(UP, p.clone().normalize());
    return { pos: p, quat: q };
  }, [loc]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const approach = remap01(
      clamp01(useVoyageScroll.getState().progress),
      VOYAGE.flyoutEnd,
      1
    );
    // Front/back cull: the pin's outward normal vs. the direction to the camera.
    groupRef.current.getWorldPosition(worldPos.current);
    const a = useEarthAnchor.getState();
    normal.current
      .set(worldPos.current.x - a.x, worldPos.current.y - a.y, worldPos.current.z - a.z)
      .normalize();
    viewDir.current.copy(camera.position).sub(worldPos.current).normalize();
    const front = normal.current.dot(viewDir.current) > 0.05;

    groupRef.current.visible = approach > 0.55 && front;

    const target = hovered ? 1.35 : 1;
    scale.current = damp(scale.current, target, 0.2);
    if (headRef.current) headRef.current.scale.setScalar(scale.current);
    if (glowRef.current) {
      const pulse = 0.4 + 0.14 * Math.sin(state.clock.getElapsedTime() * 2 + phase);
      glowRef.current.opacity = hovered ? 0.95 : pulse;
    }
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    useGalleryStore.getState().setHover(loc.id);
    document.body.style.cursor = "pointer";
  };
  const out = () => {
    setHovered(false);
    useGalleryStore.getState().setHover(null);
    document.body.style.cursor = "";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    useGalleryStore.getState().open(loc.id);
  };

  return (
    <group ref={groupRef} position={pos} quaternion={quat}>
      {/* The stem — a thin, tapered, softly translucent needle off the surface. */}
      <mesh position={[0, STEM_LEN / 2, 0]} renderOrder={3}>
        <cylinderGeometry args={[STEM_RADIUS * 0.35, STEM_RADIUS, STEM_LEN, 6]} />
        <meshBasicMaterial
          color="#ffe3c7"
          transparent
          opacity={0.7}
          depthTest={false}
          toneMapped={false}
        />
      </mesh>

      {/* The head at the tip — a small glowing bead. */}
      <group ref={headRef} position={[0, STEM_LEN, 0]}>
        <sprite scale={[GLOW_SIZE, GLOW_SIZE, 1]} renderOrder={3}>
          <spriteMaterial
            ref={glowRef}
            map={glow}
            transparent
            depthTest={false}
            depthWrite={false}
            blending={AdditiveBlending}
            opacity={0.4}
          />
        </sprite>
        <mesh renderOrder={4}>
          <sphereGeometry args={[HEAD_RADIUS, 16, 16]} />
          <meshBasicMaterial color="#ffe3c7" depthTest={false} toneMapped={false} />
        </mesh>
        {/* Generous invisible hit target so the small bead stays easy to click. */}
        <mesh onPointerOver={over} onPointerOut={out} onClick={click}>
          <sphereGeometry args={[HEAD_RADIUS * 3.5, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthTest={false} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
};
