"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LineBasicMaterial,
  LineSegments,
  Vector3,
} from "three";
import { clamp01 } from "#/components/three.js/star/utils";
import { useLabScroll } from "#/stores/useLabScroll";
import { useEarthAnchor } from "#/stores/useEarthAnchor";
import { TRAVEL_DUST as D, VOYAGER_POS } from "./config";

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/**
 * The dust corridor — REAL particles fixed in world space along the ACTUAL
 * Earth→Voyager path. The tube is built (once you leave Earth) from Voyager to
 * wherever the camera is at that instant, so you're inside the dust from the very
 * first moment of the trip. The camera genuinely flies down it; each particle is
 * a short line centred on its world position, aligned to the camera's real
 * velocity, its length + opacity scaled by how far the camera moved this frame —
 * so it streaks hard during the fast rush and vanishes as the camera settles.
 */
const TravelDust = () => {
  const camera = useThree((s) => s.camera);
  const ref = useRef<LineSegments>(null);
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isSmall ? D.countMobile : D.count;

  const prev = useRef<Vector3 | null>(null);
  const move = useRef(new Vector3()); // this frame's camera travel (reused, no garbage)
  const dir = useRef(new Vector3(0, 0, 1));
  const axisDir = useRef(new Vector3(0, 0, 1)); // corridor axis — default streak direction
  const heads = useMemo(() => new Float32Array(count * 3), [count]);
  const built = useRef(false);

  // Lay the tube from Voyager to Earth (the actual path the camera flies).
  const buildCorridor = (earth: Vector3) => {
    const origin = new Vector3(...VOYAGER_POS);
    const axis = earth.clone().sub(origin);
    const len = Math.max(axis.length(), 8);
    axis.normalize();
    axisDir.current.copy(axis);
    const up = Math.abs(axis.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3(0, 1, 0);
    const u = new Vector3().crossVectors(axis, up).normalize();
    const w = new Vector3().crossVectors(axis, u).normalize();
    for (let i = 0; i < count; i++) {
      const s = Math.random() * (len + 4); // a little past Earth too
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * D.radius;
      const p = origin
        .clone()
        .addScaledVector(axis, s)
        .addScaledVector(u, Math.cos(a) * r)
        .addScaledVector(w, Math.sin(a) * r);
      heads[i * 3] = p.x;
      heads[i * 3 + 1] = p.y;
      heads[i * 3 + 2] = p.z;
    }
    built.current = true;
  };

  const { geometry, material } = useMemo(() => {
    const positions = new Float32Array(count * 2 * 3);
    const colors = new Float32Array(count * 2 * 3);
    const peach = new Color("#FFA14A");
    const light = new Color("#FFE3C7");
    const white = new Color("#FFFFFF");
    const c = new Color();
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      c.copy(t < 0.5 ? light : t < 0.85 ? peach : white);
      for (let e = 0; e < 2; e++) {
        colors[i * 6 + e * 3] = c.r;
        colors[i * 6 + e * 3 + 1] = c.g;
        colors[i * 6 + e * 3 + 2] = c.b;
      }
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geo.setAttribute("color", new Float32BufferAttribute(colors, 3));
    const mat = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geometry: geo, material: mat };
  }, [count]);

  useFrame(() => {
    const lab = clamp01(useLabScroll.getState().progress);
    const lines = ref.current;
    if (!lines) return;

    // Re-arm at the start of each entry, and build the corridor from Voyager to
    // Earth's live position (a stable anchor — the real far end of the path).
    if (lab < 0.002) built.current = false;
    if (!built.current && lab > 0.005) {
      const a = useEarthAnchor.getState();
      buildCorridor(new Vector3(a.x, a.y, a.z));
    }

    // Real per-frame camera travel → drives streak length + opacity.
    if (!prev.current) prev.current = camera.position.clone();
    const moveDist = move.current.subVectors(camera.position, prev.current).length();
    prev.current.copy(camera.position);

    // Opacity + streak length both come from the camera's real per-frame travel,
    // kept to the beat by a lab window. Fast rush → long bright streaks; settling
    // → they fade and shrink to nothing.
    const gate = smoothstep(0.01, 0.05, lab) * (1 - smoothstep(0.85, 1.0, lab));
    const op = built.current ? Math.min(D.maxOpacity, moveDist * D.opacityK) * gate : 0;
    lines.visible = op > 0.002;
    if (!lines.visible) return;
    material.opacity = op;

    // Direction: the camera's real velocity when moving, else the corridor axis.
    if (moveDist > 1e-4) dir.current.copy(move.current).multiplyScalar(1 / moveDist);
    else dir.current.copy(axisDir.current);
    const half = Math.min(D.maxStreak, Math.max(D.minStreak, moveDist * D.streakK)) * 0.5;
    const dx = dir.current.x * half;
    const dy = dir.current.y * half;
    const dz = dir.current.z * half;

    const pos = geometry.getAttribute("position") as Float32BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let i = 0; i < count; i++) {
      const hx = heads[i * 3];
      const hy = heads[i * 3 + 1];
      const hz = heads[i * 3 + 2];
      const h = i * 6;
      arr[h] = hx + dx; arr[h + 1] = hy + dy; arr[h + 2] = hz + dz; // leading end
      arr[h + 3] = hx - dx; arr[h + 4] = hy - dy; arr[h + 5] = hz - dz; // trailing end
    }
    pos.needsUpdate = true;
  });

  return <lineSegments ref={ref} geometry={geometry} material={material} visible={false} renderOrder={5} />;
};

export default TravelDust;
