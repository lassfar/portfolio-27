"use client";

import { useFrame } from "@react-three/fiber";
import { Billboard } from "@react-three/drei";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, Group, Points, ShaderMaterial } from "three";
import { useHeroScroll } from "#/stores/useHeroScroll";
import {
  BURST,
  GLOW_PALETTE,
  LAYOUT,
  NEBULA_PALETTE,
  PARTICLES,
  ZOOM,
} from "./config";
import { remap01 } from "./utils";

type Props = {
  /** Particle count (set adaptively by the parent for perf). */
  count?: number;
  animate?: boolean;
};

// Cumulative probabilities that place a particle in each layer of the sphere.
const CORE_FRACTION = 0.13; // 0..0.13 → core
const INNER_FRACTION = 0.52; // 0.13..0.52 → inner shell; rest → outer gas

// Base opacity of the soft core glow (multiplied by the global fade).
const GLOW_OPACITY = 0.9;

/**
 * A particle nebula-star: tens of thousands of small glowing points sculpted
 * into the layers of a NASA-style nebula (blue core → blue-white inner shell →
 * red/peach outer gas), churned by animated 3D simplex noise. Additive blending
 * + the scene's Bloom make the dense core glow, and a soft billboarded shader
 * adds the central blue light.
 *
 * On scroll it bursts outward and fades; on drag it spins. All colours and
 * timing live in `config.ts`. Freezes when `animate` is false (reduced motion).
 */
const Nebula = ({ count = PARTICLES.count, animate = true }: Props) => {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const glowMatRef = useRef<ShaderMaterial>(null);
  const glowGroupRef = useRef<Group>(null);

  const { positions, colors, scales, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);

    const c = new Color();
    const blue = new Color(NEBULA_PALETTE.blue);
    const peach = new Color(NEBULA_PALETTE.gasWarm);

    for (let i = 0; i < count; i++) {
      const roll = Math.random();

      // Uniform random direction on the unit sphere.
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const dx = s * Math.cos(theta);
      const dy = s * Math.sin(theta);
      const dz = u;

      // Radius by layer; colour blends within each layer. Fully spherical so the
      // star stays round from every angle and the gas is even all around.
      let radius: number;
      let scale: number;
      if (roll < CORE_FRACTION) {
        // Core — light-blue center deepening to blue at the edge.
        radius = Math.pow(Math.random(), 2.0) * 0.5;
        const edgeness = radius / 0.5; // 0 center → 1 core edge
        c.set(NEBULA_PALETTE.coreCenter).lerp(blue, Math.pow(edgeness, 0.6));
        scale = 0.7 + Math.random() * 0.4;
      } else if (roll < INNER_FRACTION) {
        // Inner shell — the blue radial field, fading outward.
        radius = 0.55 + Math.random() * 0.9;
        c.set(NEBULA_PALETTE.innerShell).lerp(blue, Math.random() * 0.4);
        scale = 0.65 + Math.random() * 0.55;
      } else {
        // Outer gas — red → peach, diffuse.
        radius = 1.2 + Math.random() * 1.5;
        c.set(NEBULA_PALETTE.gasHot).lerp(peach, Math.random());
        scale = 0.6 + Math.random() * 0.6;
      }

      positions[i * 3] = dx * radius;
      positions[i * 3 + 1] = dy * radius;
      positions[i * 3 + 2] = dz * radius;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      scales[i] = scale;
      seeds[i] = Math.random();
    }

    return { positions, colors, scales, seeds };
  }, [count]);

  const glowUniforms = useMemo(
    () => ({ uOpacity: { value: GLOW_OPACITY } }),
    []
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: PARTICLES.size },
      uTurbulence: { value: PARTICLES.turbulence },
      uExplosion: { value: 0 },
      uOpacity: { value: 1 },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1.5,
      },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    if (animate) u.uTime.value += delta;

    const progress = useHeroScroll.getState().progress;

    // Burst the particles outward once the star has centered.
    u.uExplosion.value = remap01(
      progress,
      BURST.explosionStart,
      BURST.explosionEnd
    );

    // Fade the whole nebula out as the debris flies through the camera.
    const fade = 1 - remap01(progress, BURST.fadeStart, 1);
    u.uOpacity.value = fade;

    // Inner blue circle shrinks (local scale 1 → 0) as the star nears full
    // screen, reaching 0 exactly when the explosion starts.
    if (glowGroupRef.current) {
      const glowScale =
        1 - remap01(progress, ZOOM.centerEnd, BURST.explosionStart);
      glowGroupRef.current.scale.setScalar(glowScale);
    }

    // Core glow scales with the star (it lives inside this group) and dissolves
    // as the star bursts, so the explosion is particles — not a lingering blob.
    if (glowMatRef.current) {
      glowMatRef.current.uniforms.uOpacity.value =
        GLOW_OPACITY * (1 - u.uExplosion.value) * fade;
    }
  });

  return (
    <group scale={LAYOUT.nebulaScale}>
      {/* Blue core glow — soft and edgeless, billboarded to face the camera.
          Its own scale shrinks to 0 as the star fills the screen, vanishing
          right as the burst begins. */}
      <group ref={glowGroupRef}>
        <Billboard>
          <mesh>
            <planeGeometry args={[LAYOUT.glowSize, LAYOUT.glowSize]} />
            <shaderMaterial
              ref={glowMatRef}
              transparent
              depthWrite={false}
              blending={AdditiveBlending}
              uniforms={glowUniforms}
              vertexShader={GLOW_VERTEX_SHADER}
              fragmentShader={GLOW_FRAGMENT_SHADER}
            />
          </mesh>
        </Billboard>
      </group>

      <points ref={pointsRef}>
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
          depthWrite={false}
          blending={AdditiveBlending}
          uniforms={uniforms}
          vertexShader={VERTEX_SHADER}
          fragmentShader={FRAGMENT_SHADER}
        />
      </points>
    </group>
  );
};

export default Nebula;

// ── Shaders ──────────────────────────────────────────────────────────────────

/** Format a 0..1 RGB triplet as a GLSL `vec3(...)` literal. */
const glslVec3 = (rgb: readonly number[]): string =>
  `vec3(${rgb.map((v) => v.toFixed(4)).join(", ")})`;

// 3D simplex noise (Ashima Arts / Stefan Gustavson, public domain).
const SIMPLEX_NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x - floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}
`;

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uTurbulence;
uniform float uExplosion;   // 0 = intact, 1 = fully burst
attribute vec3 aColor;
attribute float aScale;
attribute float aSeed;
varying vec3 vColor;
varying float vTwinkle;

// Burst magnitudes at full explosion (from config.PARTICLES).
const float EXPLODE_DISTANCE = ${PARTICLES.explodeDistance.toFixed(2)};
const float EXPLODE_SCATTER = ${PARTICLES.explodeScatter.toFixed(2)};

${SIMPLEX_NOISE}

void main(){
  vColor = aColor;

  vec3 p = position;
  float t = uTime * 0.06;

  // Turbulent flow — three noise samples form a churning displacement field.
  vec3 flow = vec3(
    snoise(p * 1.1 + vec3(t, 1.3, 0.0)),
    snoise(p * 1.1 + vec3(0.0, t + 5.0, 2.1)),
    snoise(p * 1.1 + vec3(3.7, 0.0, t + 9.0))
  );
  float amt = uTurbulence * (0.25 + length(position) * 0.2);
  p += flow * amt;

  // Radial burst — push each particle outward along its own direction, with
  // extra turbulent scatter that grows as it explodes.
  vec3 burstDir = normalize(position + vec3(0.0001));
  p += burstDir * uExplosion * EXPLODE_DISTANCE;
  p += flow * uExplosion * EXPLODE_SCATTER;

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

  float tw = 0.5 + 0.5 * sin(uTime * 1.8 + aSeed * 6.2831);
  vTwinkle = tw;

  gl_PointSize = uSize * aScale * (0.55 + tw * 0.6) * uPixelRatio / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float uOpacity;
varying vec3 vColor;
varying float vTwinkle;

void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a = pow(a, 1.6);
  gl_FragColor = vec4(vColor, a * (0.45 + vTwinkle * 0.55) * uOpacity);
}
`;

// ── Core glow shader (soft blue, radially eroding) ───────────────────────────

const GLOW_VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main(){
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const GLOW_FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float uOpacity;
varying vec2 vUv;

void main(){
  float dist = length(vUv - 0.5) * 2.0; // 0 center → 1 edge

  // Soft, edgeless radial falloff — no hard circular boundary.
  float grad = pow(smoothstep(1.0, 0.0, dist), 1.7);

  // Light blue-white center → blue outward (from config.GLOW_PALETTE).
  vec3 col = mix(${glslVec3(GLOW_PALETTE.center)}, ${glslVec3(
    GLOW_PALETTE.edge
  )}, pow(dist, 0.7));

  float alpha = grad * uOpacity;
  if (alpha < 0.003) discard;
  gl_FragColor = vec4(col, alpha);
}
`;
