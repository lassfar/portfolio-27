"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PerspectiveCamera,
  Points,
  Raycaster,
  ShaderMaterial,
  Sphere,
  Vector2,
  Vector3,
} from "three";
import { damp } from "#/components/three.js/star/utils";
import { useEarthAnchor } from "#/stores/useEarthAnchor";
import { useSceneRotation } from "#/stores/useSceneRotation";
import { SUNPOS } from "#/components/three.js/solar/config";
import { earthReveal } from "#/components/three.js/solar/reveal";
import { EARTH } from "./config";
import { directionToUV } from "./utils";
import { earthOwnsDrag, dragMode } from "./interaction";
import EarthPins from "./EarthPins";

type Props = {
  animate?: boolean;
  /** Master enable for pointer-drag (drag is additionally gated to the Earth phase). */
  interactive?: boolean;
};

type DotBuffers = {
  positions: Float32Array;
  colors: Float32Array;
  scales: Float32Array;
  seeds: Float32Array;
  /** Ocean dots per unit of surface ÷ all dots per unit of surface (its level of detail
   *  keeps the open ocean — the sparsest part — covered). */
  oceanDensity: number;
};

const DEG = Math.PI / 180;

/**
 * The interactive Earth — a dense sphere of dots coloured per-dot from a real
 * land/ocean map (warm land, dim blue ocean) and a dark inner sphere hiding the
 * back-facing dots so the front continents read cleanly. Drag to spin it; release
 * and it resumes a gentle idle self-spin. It fades in with the system. City
 * photo-pins hang off it in M3.
 */
const DottedEarth = ({ animate = true, interactive = true }: Props) => {
  const sceneMirrorRef = useRef<Group>(null);
  const tiltRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);
  const pointsRef = useRef<Points>(null);
  const dotMatRef = useRef<ShaderMaterial>(null);
  const coreRef = useRef<Mesh>(null); // the solid core under the dots
  const coreMatRef = useRef<MeshBasicMaterial>(null);

  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const sunDir = useRef(new Vector3());
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
      let oceanTries = 0; // ocean candidates (∝ the ocean's share of the surface)
      let oceanKept = 0;
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
        const px = Math.min(
          cv.width - 1,
          Math.max(0, Math.round(u * cv.width))
        );
        const py = Math.min(
          cv.height - 1,
          Math.max(0, Math.round(v * cv.height))
        );
        const isLand =
          data[(py * cv.width + px) * 4] / 255 < EARTH.landThreshold; // dark = land

        // Bias toward land: keep every land dot, drop most ocean dots.
        if (!isLand) oceanTries++;
        if (!isLand && Math.random() > EARTH.oceanDensity) continue;
        if (!isLand) oceanKept++;

        // Tiny radial shell jitter → grainy, dotty surface (like the Saturn shell).
        const rr =
          EARTH.radius * (1 + (Math.random() - 0.5) * EARTH.shellJitter);
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
      // The ocean's share of the dots ÷ its share of the surface.
      const oceanDensity = oceanTries > 0 && i > 0 ? oceanKept / i / (oceanTries / guard) : 1;
      setBuffers({ positions, colors, scales, seeds, oceanDensity });
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
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1.5,
      },
      uReveal: { value: 0 },
      // The sun's direction in VIEW space — recomputed each frame from the sun's
      // and Earth's world positions, so lighting comes from the real sun.
      uLightDir: { value: new Vector3(0, 0, 1) },
      uAmbient: { value: EARTH.light.ambient },
      // Level of detail: the dots drawn (the first uLodCount) + the share that fades.
      uLodCount: { value: count },
      uLodFade: { value: EARTH.lod.fadeBand },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `count` only seeds uLodCount (updated each frame)
    []
  );
  const earthPos = useMemo(() => new Vector3(), []);

  // ── Drag-rotate (globe spin) ────────────────────────────────────────────────
  const targetYaw = useRef<number>(EARTH.initialYaw);
  const targetPitch = useRef(0);
  const yaw = useRef<number>(EARTH.initialYaw);
  const pitch = useRef(0);
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const sinceRelease = useRef<number>(EARTH.spinResumeDelay);
  // Scene rotation captured when the Earth became the focus — the scene-mirror
  // subtracts it so only later space-drags turn the Earth (no arrival-pose offset).
  const sceneBaseline = useRef<{ pitch: number; yaw: number } | null>(null);
  // Scratch for the pointer-down hit-test (globe vs. empty space).
  const hit = useMemo(
    () => ({ rc: new Raycaster(), sphere: new Sphere(), point: new Vector3(), ndc: new Vector2() }),
    []
  );

  useEffect(() => {
    if (!interactive) return;
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      dragging.current = true;
      last.current = { x: e.clientX, y: e.clientY };
      // Decide what THIS drag controls: a ray through the pointer that hits the
      // globe (while the Earth is the focus) grabs the GLOBE; anything else grabs
      // the SCENE (empty space → the whole cosmos turns, Earth carried with it).
      const w = el.clientWidth || 1;
      const h = el.clientHeight || 1;
      hit.ndc.set((e.offsetX / w) * 2 - 1, -(e.offsetY / h) * 2 + 1);
      hit.rc.setFromCamera(hit.ndc, camera);
      const a = useEarthAnchor.getState();
      hit.sphere.center.set(a.x, a.y, a.z);
      hit.sphere.radius = EARTH.radius;
      const onGlobe = hit.rc.ray.intersectSphere(hit.sphere, hit.point) !== null;
      dragMode.current = earthOwnsDrag() && onGlobe ? "globe" : "scene";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      // Spin the globe only when THIS drag grabbed it. Keep `last` fresh while
      // stood down (a scene drag) so nothing snaps if it ever changes hands.
      if (dragMode.current !== "globe") {
        last.current = { x: e.clientX, y: e.clientY };
        return;
      }
      const dx = e.clientX - last.current.x;
      const dy = e.clientY - last.current.y;
      last.current = { x: e.clientX, y: e.clientY };
      targetYaw.current += dx * EARTH.dragSensitivity;
      targetPitch.current += dy * EARTH.dragSensitivity;
      // Keep the poles from flipping over.
      targetPitch.current = Math.max(-1.2, Math.min(1.2, targetPitch.current));
    };
    const onUp = () => {
      // Only a GLOBE drag pauses the idle spin, so only it re-arms the resume timer.
      if (dragMode.current === "globe") sinceRelease.current = 0;
      dragging.current = false;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl, interactive, camera, hit]);

  useFrame((state, delta) => {
    // Earth appears WITH the system (like a sibling) and stays — it's a member,
    // not a grow-in. No scale transition; the camera does all the approaching. It
    // fades out as the Lab pulls away to the Voyager, back in for the finale.
    const r = earthReveal();
    if (coreRef.current && coreMatRef.current) {
      coreRef.current.visible = EARTH.showCore && r > 0.001;
      coreRef.current.scale.setScalar(EARTH.radius * EARTH.coreScale);
      coreMatRef.current.opacity = r;
    }
    if (dotMatRef.current) {
      dotMatRef.current.uniforms.uReveal.value = r;
      if (animate) dotMatRef.current.uniforms.uTime.value += delta; // twinkle
      // Light from the ACTUAL sun: direction Earth → sun, in view space.
      const a = useEarthAnchor.getState();
      sunDir.current
        .set(SUNPOS[0] - a.x, SUNPOS[1] - a.y, SUNPOS[2] - a.z)
        .transformDirection(camera.matrixWorldInverse);
      dotMatRef.current.uniforms.uLightDir.value.copy(sunDir.current);

      // Level of detail: far away every dot is a 1 px point and each pixel shows the
      // last one drawn there, so draw just enough to keep every pixel covered — at
      // least EARTH.lod.perPixel per pixel in open ocean. Full field from ~14 px on.
      const points = pointsRef.current;
      if (points && buffers && r > 0.001) {
        const cam = state.camera as PerspectiveCamera;
        const dist = Math.max(points.getWorldPosition(earthPos).distanceTo(cam.position), EARTH.radius * 1.05);
        const focal = state.size.height / 2 / Math.tan((cam.fov * DEG) / 2);
        const radiusPx = (EARTH.radius * focal) / dist;
        const dots = Math.min(
          count,
          (EARTH.lod.perPixel * 4 * Math.PI * radiusPx * radiusPx) / buffers.oceanDensity
        );
        points.geometry.setDrawRange(0, Math.min(count, Math.ceil(dots * (1 + EARTH.lod.fadeBand))));
        dotMatRef.current.uniforms.uLodCount.value = dots;
      }
    }
    if (tiltRef.current) tiltRef.current.visible = r > 0.001;

    // Idle self-spin (a planet's day) whenever the Earth is visible; it pauses
    // ONLY while the globe itself is being dragged (a scene drag leaves the auto-
    // rotation playing), and resumes a beat after a globe drag is released.
    if (animate && r > 0.001) {
      const globeDragging = dragging.current && dragMode.current === "globe";
      if (!globeDragging) {
        sinceRelease.current += delta;
        if (sinceRelease.current > EARTH.spinResumeDelay) {
          targetYaw.current += delta * EARTH.spin;
        }
      }
    }
    yaw.current = damp(yaw.current, targetYaw.current, EARTH.dragDamping);
    pitch.current = damp(pitch.current, targetPitch.current, EARTH.dragDamping);
    if (spinRef.current)
      spinRef.current.rotation.set(pitch.current, yaw.current, 0);

    // Scene-mirror: when the SPACE is dragged the Earth turns WITH the whole cosmos
    // (like Saturn). This outer group mirrors the scene-rotation DELTA since the
    // Earth became the focus, so it never offsets the arrival pose — only a space
    // drag (which moves useSceneRotation) turns it, by the same angle as the stars.
    const owns = earthOwnsDrag();
    const sr = useSceneRotation.getState();
    if (owns) {
      if (!sceneBaseline.current) sceneBaseline.current = { pitch: sr.pitch, yaw: sr.yaw };
    } else {
      sceneBaseline.current = null;
    }
    if (sceneMirrorRef.current) {
      const b = sceneBaseline.current;
      sceneMirrorRef.current.rotation.set(
        b ? sr.pitch - b.pitch : 0,
        b ? sr.yaw - b.yaw : 0,
        0
      );
    }
  });

  return (
    <>
      {/* Scene-mirror (space drag → Earth turns with the cosmos), then axial tilt,
          then the globe's own drag/idle spin. */}
      <group ref={sceneMirrorRef}>
        <group ref={tiltRef} rotation={[0, 0, EARTH.tilt]} visible={false}>
          <group ref={spinRef}>
            {/* The solid core (EARTH.showCore): drawn before every dot (renderOrder −0.5,
              like the planets' cores) and writing depth, so nothing behind the globe
              shows through its gaps; transparent so it fades with the Earth. */}
            <mesh ref={coreRef} renderOrder={-0.5} visible={false}>
              <sphereGeometry args={[1, 48, 32]} />
              <meshBasicMaterial ref={coreMatRef} color={EARTH.coreColor} transparent depthWrite opacity={0} />
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

            {/* Geo photo-pins — stick to the surface as the globe spins. */}
            <EarthPins />
          </group>
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
uniform float uLodCount, uLodFade;
attribute vec3 aColor;
attribute float aScale;
attribute float aSeed;
varying vec3 vColor;
varying float vBright;
varying float vLod;

void main(){
  vColor = aColor;
  // Level of detail: the dots past uLodCount fade out over the next uLodFade share
  // (every dot is at 1.0 when the whole field is drawn).
  float index = float(gl_VertexID);
  vLod = clamp((uLodCount * (1.0 + uLodFade) - index) / max(uLodCount * uLodFade, 1.0), 0.0, 1.0);

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
varying float vLod;

void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.15, d) * uReveal * vLod;
  if (a < 0.01) discard;
  gl_FragColor = vec4(vColor * vBright, a);
}
`;
