"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  ShaderMaterial,
  Vector3,
} from "three";
import { SIMPLEX_NOISE } from "#/components/three.js/planet/shaders";
import { MOTION, type PlanetConfig, TYPE_INDEX } from "./config";

type Props = {
  config: PlanetConfig;
  animate?: boolean;
};

/**
 * A single HYBRID planet: a solid, procedurally shaded sphere (rocky / gas /
 * ice — lit by the central Sun) wrapped in a soft atmospheric glow shell, plus
 * an optional ring system. The body self-spins on a slight axial tilt; the
 * rings share the tilt but not the spin. Orbit placement is handled by the
 * parent.
 */
const Planet = ({ config, animate = true }: Props) => {
  const { camera } = useThree();
  const bodyRef = useRef<Group>(null);
  const surfaceRef = useRef<ShaderMaterial>(null);
  const atmoRef = useRef<ShaderMaterial>(null);
  const sunViewPos = useMemo(() => new Vector3(), []);

  const surfaceUniforms = useMemo(
    () => ({
      uType: { value: TYPE_INDEX[config.type] },
      c1: { value: new Color(config.base) },
      c2: { value: new Color(config.dark) },
      c3: { value: new Color(config.light) },
      uSpot: { value: config.spot ? 1 : 0 },
      uTime: { value: Math.random() * 20 },
      uFlow: { value: MOTION.flowSpeed },
      uSunViewPos: { value: new Vector3() },
    }),
    [config]
  );

  const atmoUniforms = useMemo(
    () => ({
      uColor: { value: new Color(config.light) },
      uStrength: { value: config.type === "rocky" ? 0.14 : 0.3 },
      uSunViewPos: { value: new Vector3() },
    }),
    [config]
  );

  const rings = useMemo(
    () => (config.rings ? buildRings(config) : null),
    [config]
  );

  useFrame((_, delta) => {
    // Light every planet from the Sun at the world origin: express its position
    // in view space so the surface + atmosphere shade the sun-facing side.
    sunViewPos.set(0, 0, 0).applyMatrix4(camera.matrixWorldInverse);
    if (surfaceRef.current)
      surfaceRef.current.uniforms.uSunViewPos.value.copy(sunViewPos);
    if (atmoRef.current)
      atmoRef.current.uniforms.uSunViewPos.value.copy(sunViewPos);

    if (!animate) return;
    if (bodyRef.current) bodyRef.current.rotation.y += delta * MOTION.spinSpeed;
    if (surfaceRef.current) surfaceRef.current.uniforms.uTime.value += delta;
  });

  return (
    // Slight axial tilt so bands and rings read as three-dimensional.
    <group rotation={[0.32, 0, 0.12]}>
      <group ref={bodyRef}>
        <mesh>
          <sphereGeometry args={[config.radius, 64, 64]} />
          <shaderMaterial
            ref={surfaceRef}
            uniforms={surfaceUniforms}
            vertexShader={SURFACE_VERTEX}
            fragmentShader={SURFACE_FRAGMENT}
          />
        </mesh>

        {/* Smooth atmospheric glow shell — a soft fresnel halo that reads as
            atmosphere without the sub-pixel flicker of a particle halo. */}
        <mesh scale={1.07}>
          <sphereGeometry args={[config.radius, 48, 48]} />
          <shaderMaterial
            ref={atmoRef}
            transparent
            depthWrite={false}
            blending={AdditiveBlending}
            uniforms={atmoUniforms}
            vertexShader={ATMO_VERTEX}
            fragmentShader={ATMO_FRAGMENT}
          />
        </mesh>
      </group>

      {rings && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[rings.inner, rings.outer, 96, 1]} />
          <shaderMaterial
            transparent
            side={DoubleSide}
            depthWrite={false}
            uniforms={rings.uniforms}
            vertexShader={RING_VERTEX}
            fragmentShader={RING_FRAGMENT}
          />
        </mesh>
      )}
    </group>
  );
};

export default Planet;

// ── Halo + ring builders ─────────────────────────────────────────────────────

function buildRings(config: PlanetConfig) {
  return {
    inner: config.radius * 1.4,
    outer: config.radius * 2.35,
    uniforms: {
      uInner: { value: config.radius * 1.4 },
      uOuter: { value: config.radius * 2.35 },
      uColor: { value: new Color("#f0e0be") },
    },
  };
}

// ── Shaders ──────────────────────────────────────────────────────────────────

const SURFACE_VERTEX = /* glsl */ `
varying vec3 vLocal;
varying vec3 vN;
varying vec3 vView;
varying vec3 vViewPos;
void main(){
  vLocal = position;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const SURFACE_FRAGMENT = /* glsl */ `
precision highp float;
uniform int uType;
uniform vec3 c1, c2, c3;
uniform vec3 uSunViewPos;
uniform float uTime;
uniform float uFlow;
uniform float uSpot;
varying vec3 vLocal;
varying vec3 vN;
varying vec3 vView;
varying vec3 vViewPos;

${SIMPLEX_NOISE}

float fbm(vec3 p){
  float f = 0.0, a = 0.5;
  for(int i = 0; i < 5; i++){ f += a * snoise(p); p *= 2.03; a *= 0.5; }
  return f;
}

void main(){
  vec3 n = normalize(vLocal);
  vec3 col;

  if(uType == 0){                     // rocky — mottled surface + craters
    float f = fbm(vLocal * 2.8);
    float cr = fbm(vLocal * 5.5);
    col = mix(c2, c1, 0.5 + 0.5 * f);
    col = mix(col, c3, smoothstep(0.2, 0.8, f));
    col *= 0.74 + 0.26 * smoothstep(-0.25, 0.55, cr);
  } else if(uType == 1){              // gas — soft latitude belts, drifting
    float warp = fbm(vLocal * 2.2 + vec3(0.0, uTime * uFlow, 0.0)) * 2.2;
    float b = sin(n.y * 13.0 + warp);
    float t = smoothstep(0.25, 0.75, 0.5 + 0.5 * b); // soft belt edges
    col = mix(c2, c1, t);
    col = mix(col, c3, smoothstep(0.6, 1.0, t));
    float swirl = fbm(vLocal * 3.2 + vec3(0.0, uTime * uFlow, 0.0));
    col *= 0.92 + 0.08 * swirl;       // gentle mottling within belts
    if(uSpot > 0.5){
      float sp = smoothstep(0.16, 0.0, length(n - normalize(vec3(0.55, -0.28, 0.78))));
      col = mix(col, vec3(0.72, 0.3, 0.16), sp * 0.9);
    }
  } else {                            // ice — smooth, faint banding
    float b = sin(n.y * 8.5 + fbm(vLocal * 2.0) * 1.4);
    col = mix(c2, c1, 0.5 + 0.5 * b);
    col = mix(col, c3, 0.25 + 0.28 * fbm(vLocal * 3.4));
  }

  // Diffuse lighting from the Sun (world origin). An ambient floor keeps the
  // planets readable from the near-top-down camera (where the lit hemisphere
  // faces inward), while the directional term still gives dimension.
  vec3 L = normalize(uSunViewPos - vViewPos);
  float diff = max(dot(vN, L), 0.0);
  col *= 0.42 + 0.72 * diff;

  // Soft rim on the limb (broad + gentle so it doesn't alias under motion).
  float fres = pow(1.0 - max(dot(vN, vView), 0.0), 1.8);
  col += c3 * fres * 0.18 * (0.4 + diff);

  gl_FragColor = vec4(col, 1.0);
}
`;

const ATMO_VERTEX = /* glsl */ `
varying vec3 vN;
varying vec3 vView;
varying vec3 vViewPos;
void main(){
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vViewPos = mv.xyz;
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const ATMO_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColor;
uniform float uStrength;
uniform vec3 uSunViewPos;
varying vec3 vN;
varying vec3 vView;
varying vec3 vViewPos;
void main(){
  // Broad fresnel glow, brightest at the limb and on the sun-facing side.
  float rim = pow(1.0 - max(dot(vN, vView), 0.0), 2.0);
  vec3 L = normalize(uSunViewPos - vViewPos);
  float lit = max(dot(vN, L), 0.0);
  gl_FragColor = vec4(uColor, rim * (0.25 + 0.75 * lit) * uStrength);
}
`;

const RING_VERTEX = /* glsl */ `
varying vec2 vXY;
void main(){
  vXY = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RING_FRAGMENT = /* glsl */ `
precision highp float;
varying vec2 vXY;
uniform float uInner, uOuter;
uniform vec3 uColor;
void main(){
  float r = length(vXY);
  float t = (r - uInner) / (uOuter - uInner);
  if(t < 0.0 || t > 1.0) discard;
  float bands = 0.6 + 0.4 * sin(t * 26.0);
  float gap = smoothstep(0.40, 0.45, t) * (1.0 - smoothstep(0.50, 0.55, t));
  float edge = smoothstep(0.0, 0.06, t) * (1.0 - smoothstep(0.92, 1.0, t));
  float a = bands * edge * (1.0 - gap * 0.85) * 0.9;
  gl_FragColor = vec4(uColor * (0.6 + bands * 0.5), a);
}
`;
