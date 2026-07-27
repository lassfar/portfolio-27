"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { Color, Group, NormalBlending, Points, ShaderMaterial } from "three";
import { clamp01, damp, easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { SOLAR, VOYAGE } from "#/components/three.js/solar/config";
import { EARTH } from "./config";
import { directionToUV } from "./utils";

type Props = {
  animate?: boolean;
  /** Master enable for pointer-drag (drag is additionally gated to the Earth phase). */
  interactive?: boolean;
};

/** Earth-approach progress (0..1) — the globe reveals + becomes draggable here. */
const earthApproach = () =>
  remap01(clamp01(useVoyageScroll.getState().progress), VOYAGE.flyoutEnd, 1);

type DotBuffers = {
  positions: Float32Array;
  colors: Float32Array;
  scales: Float32Array;
  seeds: Float32Array;
};

/**
 * The interactive Earth — a dense sphere of dots coloured per-dot from a real
 * land/ocean map (warm land, dim blue ocean) and a dark inner sphere hiding the
 * back-facing dots so the front continents read cleanly. Drag to spin it; release
 * and it resumes a gentle idle self-spin. It fades in with the system. City
 * photo-pins hang off it in M3.
 */
const DottedEarth = ({ animate = true, interactive = true }: Props) => {
  const tiltRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);
  const pointsRef = useRef<Points>(null);
  const dotMatRef = useRef<ShaderMaterial>(null);

  const gl = useThree((s) => s.gl);
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isSmall ? EARTH.dotCountMobile : EARTH.dotCount;

  // ── Build the dot field once the land mask has loaded ──────────────────────
  const [buffers, setBuffers] = useState<DotBuffers | null>(null);
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.src = EARTH.maskUrl;
    img.onload = () => {
      if (cancelled) return;
      const cv = document.createElement("canvas");
      cv.width = img.width;
      cv.height = img.height;
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data;

      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const scales = new Float32Array(count);
      const seeds = new Float32Array(count);
      const land = new Color(EARTH.landColor);
      const ocean = new Color(EARTH.oceanColor);
      const c = new Color();

      // Fill the field with rejection sampling: LAND candidates are always kept,
      // OCEAN candidates are mostly dropped (EARTH.oceanDensity) — so far more of
      // the dots pack onto the continents and the map reads clearly.
      let i = 0;
      let guard = 0;
      const maxTries = count * 40;
      while (i < count && guard < maxTries) {
        guard++;
        // Random uniform direction on the sphere (grainy, like the Saturn) rather
        // than an even Fibonacci lattice — no visible moiré spirals.
        const uu = Math.random() * 2 - 1;
        const theta = Math.random() * Math.PI * 2;
        const s = Math.sqrt(1 - uu * uu);
        const x = s * Math.cos(theta);
        const y = uu;
        const z = s * Math.sin(theta);

        const [u, v] = directionToUV(x, y, z);
        const px = Math.min(cv.width - 1, Math.max(0, Math.round(u * cv.width)));
        const py = Math.min(cv.height - 1, Math.max(0, Math.round(v * cv.height)));
        const isLand = data[(py * cv.width + px) * 4] / 255 < EARTH.landThreshold; // dark = land

        // Bias toward land: keep every land dot, drop most ocean dots.
        if (!isLand && Math.random() > EARTH.oceanDensity) continue;

        // Tiny radial shell jitter → grainy, dotty surface (like the Saturn shell).
        const rr = EARTH.radius * (1 + (Math.random() - 0.5) * EARTH.shellJitter);
        positions[i * 3] = x * rr;
        positions[i * 3 + 1] = y * rr;
        positions[i * 3 + 2] = z * rr;

        // Per-particle brightness jitter → the noisy grain the Saturn has.
        const j = 0.82 + Math.random() * 0.32;
        c.copy(isLand ? land : ocean).multiplyScalar(
          (isLand ? EARTH.landBright : EARTH.oceanBright) * j
        );
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;

        // Land grains thicker than ocean → the continents read solid + prominent.
        scales[i] =
          (isLand ? EARTH.landDotScale : EARTH.oceanDotScale) *
          (0.7 + Math.random() * 0.6);
        seeds[i] = Math.random();
        i++;
      }
      setBuffers({ positions, colors, scales, seeds });
    };
    return () => {
      cancelled = true;
    };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: EARTH.dotSize },
      uMaxSize: { value: EARTH.dotMaxSize },
      uPixelRatio: {
        value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1.5,
      },
      uReveal: { value: 0 },
      uLightDir: { value: EARTH.light.dir },
      uAmbient: { value: EARTH.light.ambient },
    }),
    []
  );

  // ── Drag-rotate ────────────────────────────────────────────────────────────
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);
  const yaw = useRef(0);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const sinceRelease = useRef<number>(EARTH.spinResumeDelay);

  useEffect(() => {
    if (!interactive) return;
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      if (earthApproach() < 0.4) return; // only once the globe is present
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      targetYaw.current += dx * EARTH.dragSensitivity;
      targetPitch.current += dy * EARTH.dragSensitivity;
      // Keep the poles from flipping over.
      targetPitch.current = Math.max(-1.2, Math.min(1.2, targetPitch.current));
    };
    const onUp = () => {
      dragging.current = false;
      sinceRelease.current = 0;
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
    // Earth appears WITH the system (like a sibling) and stays — it's a member,
    // not a grow-in. No scale transition; the camera does all the approaching.
    const voyage = clamp01(useVoyageScroll.getState().progress);
    const r = easeOutCubic(remap01(voyage, SOLAR.revealStart, SOLAR.revealEnd));
    if (dotMatRef.current) {
      dotMatRef.current.uniforms.uReveal.value = r;
      if (animate) dotMatRef.current.uniforms.uTime.value += delta; // twinkle
    }
    if (tiltRef.current) tiltRef.current.visible = r > 0.001;

    // Idle self-spin (a planet's day) whenever the Earth is visible; it pauses
    // during a drag and resumes a beat after release.
    if (animate && r > 0.001) {
      if (!dragging.current) {
        sinceRelease.current += delta;
        if (sinceRelease.current > EARTH.spinResumeDelay) {
          targetYaw.current += delta * EARTH.spin;
        }
      }
    }
    yaw.current = damp(yaw.current, targetYaw.current, EARTH.dragDamping);
    pitch.current = damp(pitch.current, targetPitch.current, EARTH.dragDamping);
    if (spinRef.current) spinRef.current.rotation.set(pitch.current, yaw.current, 0);
  });

  return (
    <>
      {/* Axial tilt, then drag/idle spin. */}
      <group ref={tiltRef} rotation={[0, 0, EARTH.tilt]} visible={false}>
        <group ref={spinRef}>
          {/* Dark inner sphere hides the back-facing dots. */}
          <mesh scale={EARTH.coreScale} renderOrder={1}>
            <sphereGeometry args={[EARTH.radius, 48, 48]} />
            <meshBasicMaterial color={EARTH.coreColor} />
          </mesh>

          {buffers && (
            <points ref={pointsRef} renderOrder={2}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={count}
                  array={buffers.positions}
                  itemSize={3}
                  args={[buffers.positions, 3]}
                />
                <bufferAttribute
                  attach="attributes-aColor"
                  count={count}
                  array={buffers.colors}
                  itemSize={3}
                  args={[buffers.colors, 3]}
                />
                <bufferAttribute
                  attach="attributes-aScale"
                  count={count}
                  array={buffers.scales}
                  itemSize={1}
                  args={[buffers.scales, 1]}
                />
                <bufferAttribute
                  attach="attributes-aSeed"
                  count={count}
                  array={buffers.seeds}
                  itemSize={1}
                  args={[buffers.seeds, 1]}
                />
              </bufferGeometry>
              <shaderMaterial
                ref={dotMatRef}
                transparent
                depthTest
                depthWrite={false}
                blending={NormalBlending}
                uniforms={uniforms}
                vertexShader={VERTEX_SHADER}
                fragmentShader={FRAGMENT_SHADER}
              />
            </points>
          )}
        </group>
      </group>
    </>
  );
};

export default DottedEarth;

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uMaxSize;
uniform float uPixelRatio;
uniform vec3 uLightDir;
uniform float uAmbient;
attribute vec3 aColor;
attribute float aScale;
attribute float aSeed;
varying vec3 vColor;
varying float vBright;

void main(){
  vColor = aColor;

  // A dot's surface normal is its (radial) direction. Back-face cull: if it faces
  // away from the camera it's on the hidden hemisphere (behind the opaque core),
  // so skip it entirely instead of rasterising then depth-discarding it.
  vec3 viewNormal = normalize(normalMatrix * normalize(position));
  if (viewNormal.z < -0.1) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // off-screen (clipped)
    gl_PointSize = 0.0;
    return;
  }

  // Directional (view-space) lighting → a lit + shadowed side, like the Saturn.
  float diff = max(dot(viewNormal, normalize(uLightDir)), 0.0);
  vBright = uAmbient + (1.0 - uAmbient) * diff;

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // Per-dot twinkle (size shimmer), like the Saturn grain.
  float tw = 0.7 + 0.4 * sin(uTime * 1.5 + aSeed * 6.2831);
  // Cap the size so dots can't balloon (and overdraw) when the camera is close.
  gl_PointSize = min(uSize * aScale * tw * uPixelRatio / -mv.z, uMaxSize * uPixelRatio);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float uReveal;
varying vec3 vColor;
varying float vBright;

void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.15, d) * uReveal;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * vBright, a);
}
`;
