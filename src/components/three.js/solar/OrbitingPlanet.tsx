"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, NormalBlending, ShaderMaterial, Group } from "three";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { orbitPosition, PlanetDef, SOLAR } from "./config";

type Props = {
  def: PlanetDef;
  count: number;
  animate?: boolean;
};

/**
 * One planet — a particle-dot sphere lit by a single fixed (view-space) light so
 * it keeps a lit + shadowed side, on a CONTINUOUS orbit around the sun with a
 * gentle self-spin (both run on the real-time clock, not the scroll). Fades in
 * with the system over the reveal window. `uThin` is wired for the fly-past LOD
 * used when we approach Earth (M2); it stays 0 here.
 */
const OrbitingPlanet = ({ def, count, animate = true }: Props) => {
  const orbitRef = useRef<Group>(null); // positioned on the orbit each frame
  const spinRef = useRef<Group>(null); // self-rotation
  const materialRef = useRef<ShaderMaterial>(null);

  const { positions, colors, scales, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);

    const c = new Color();
    const base = new Color(def.color);
    const bright = base.clone().lerp(new Color("#ffffff"), 0.35);
    const dark = base.clone().multiplyScalar(0.55);

    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      // Thin surface shell with a touch of grain.
      const r = def.size * (1 + (Math.random() - 0.5) * 0.06);
      positions[i * 3] = s * Math.cos(theta) * r;
      positions[i * 3 + 1] = u * r;
      positions[i * 3 + 2] = s * Math.sin(theta) * r;

      // Mottled surface: mostly base, some brighter/darker flecks.
      const t = Math.random();
      if (t < 0.2) c.copy(dark).lerp(base, Math.random());
      else if (t > 0.85) c.copy(base).lerp(bright, Math.random());
      else c.copy(base);
      const j = 0.85 + Math.random() * 0.3;
      colors[i * 3] = c.r * j;
      colors[i * 3 + 1] = c.g * j;
      colors[i * 3 + 2] = c.b * j;

      scales[i] = 0.6 + Math.random() * 0.7;
      seeds[i] = Math.random();
    }
    return { positions, colors, scales, seeds };
  }, [count, def.color, def.size]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: def.highlight ? 11 : 9 },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1.5,
      },
      uReveal: { value: 0 },
      uThin: { value: 0 },
      uLightDir: { value: SOLAR.light.dir },
      uAmbient: { value: SOLAR.light.ambient },
      uBoost: { value: def.highlight ? 1.18 : 1.0 },
    }),
    [def.highlight]
  );

  useFrame((state, delta) => {
    const m = materialRef.current;
    if (!m) return;
    if (animate) {
      m.uniforms.uTime.value += delta;
      if (spinRef.current) spinRef.current.rotation.y += delta * def.spin;
    }
    // Continuous orbit on the real-time clock, along the edge-on flatten basis.
    const t = state.clock.getElapsedTime();
    const a = def.phase + t * def.orbitSpeed;
    if (orbitRef.current) {
      const [x, y, z] = orbitPosition(def.radius, a);
      orbitRef.current.position.set(x, y, z);
    }
    const voyage = useVoyageScroll.getState().progress;
    m.uniforms.uReveal.value = easeOutCubic(
      remap01(voyage, SOLAR.revealStart, SOLAR.revealEnd)
    );
    // Mild dot-thinning as the camera pulls away (these siblings are small + far).
    m.uniforms.uThin.value = SOLAR.planetThinMax * voyage;
  });

  return (
    <group ref={orbitRef}>
      <group ref={spinRef}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={count}
              array={positions}
              itemSize={3}
              args={[positions, 3]}
            />
            <bufferAttribute
              attach="attributes-aColor"
              count={count}
              array={colors}
              itemSize={3}
              args={[colors, 3]}
            />
            <bufferAttribute
              attach="attributes-aScale"
              count={count}
              array={scales}
              itemSize={1}
              args={[scales, 1]}
            />
            <bufferAttribute
              attach="attributes-aSeed"
              count={count}
              array={seeds}
              itemSize={1}
              args={[seeds, 1]}
            />
          </bufferGeometry>
          <shaderMaterial
            ref={materialRef}
            transparent
            depthWrite
            blending={NormalBlending}
            uniforms={uniforms}
            vertexShader={VERTEX_SHADER}
            fragmentShader={FRAGMENT_SHADER}
          />
        </points>
      </group>
    </group>
  );
};

export default OrbitingPlanet;

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform vec3 uLightDir;
uniform float uAmbient;
attribute vec3 aColor;
attribute float aScale;
attribute float aSeed;
varying vec3 vColor;
varying float vBright;
varying float vSeed;

void main(){
  vColor = aColor;
  vSeed = aSeed;
  vec3 viewNrm = normalize(normalMatrix * normalize(position));
  float diff = max(dot(viewNrm, normalize(uLightDir)), 0.0);
  vBright = uAmbient + (1.0 - uAmbient) * diff;

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float tw = 0.85 + 0.15 * sin(uTime * 1.5 + aSeed * 6.2831);
  gl_PointSize = uSize * aScale * tw * uPixelRatio / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float uReveal;
uniform float uThin;
uniform float uBoost;
varying vec3 vColor;
varying float vBright;
varying float vSeed;

void main(){
  if (vSeed < uThin) discard;
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.15, d) * uReveal;
  if (a < 0.003) discard;
  // Hold the lit side just under the bloom threshold so planets read as solid
  // colour, not white flares (only the sun is meant to bloom).
  gl_FragColor = vec4(vColor * vBright * uBoost * 0.62, a);
}
`;
