"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, Mesh, ShaderMaterial } from "three";
import { SIMPLEX_NOISE } from "#/components/three.js/planet/shaders";
import { SUN } from "./config";

type Props = {
  animate?: boolean;
};

/**
 * The Sun at the centre of the orbit — the surviving core of the Hero's star
 * (you). A solid, self-lit plasma sphere: animated granulation cells over a
 * white-gold core with a hot orange limb, wrapped in an additive corona halo.
 * The scene's Bloom pushes the glow. It is also the light source for every
 * planet (they read its world-origin position in their own shaders).
 */
const Sun = ({ animate = true }: Props) => {
  const bodyRef = useRef<Mesh>(null);
  const surfaceRef = useRef<ShaderMaterial>(null);
  const coronaRef = useRef<ShaderMaterial>(null);

  const surfaceUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uCore: { value: new Color(SUN.core) },
      uMid: { value: new Color(SUN.mid) },
      uEdge: { value: new Color(SUN.edge) },
      uTurb: { value: SUN.turbulence },
    }),
    []
  );

  const coronaUniforms = useMemo(
    () => ({
      uColor: { value: new Color(SUN.corona) },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!animate) return;
    if (surfaceRef.current) surfaceRef.current.uniforms.uTime.value += delta;
    if (bodyRef.current) bodyRef.current.rotation.y += delta * SUN.spinSpeed;
  });

  return (
    <group>
      {/* Solid plasma disc */}
      <mesh ref={bodyRef}>
        <sphereGeometry args={[SUN.radius, 64, 64]} />
        <shaderMaterial
          ref={surfaceRef}
          uniforms={surfaceUniforms}
          vertexShader={SURFACE_VERTEX}
          fragmentShader={SURFACE_FRAGMENT}
        />
      </mesh>

      {/* Corona: a slightly larger shell glowing at the limb, clear over the disc */}
      <mesh scale={1.5}>
        <sphereGeometry args={[SUN.radius, 48, 48]} />
        <shaderMaterial
          ref={coronaRef}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          uniforms={coronaUniforms}
          vertexShader={CORONA_VERTEX}
          fragmentShader={CORONA_FRAGMENT}
        />
      </mesh>
    </group>
  );
};

export default Sun;

// ── Shaders ──────────────────────────────────────────────────────────────────

const SURFACE_VERTEX = /* glsl */ `
varying vec3 vLocal;
varying vec3 vN;
varying vec3 vView;
void main(){
  vLocal = position;
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const SURFACE_FRAGMENT = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec3 uCore, uMid, uEdge;
uniform float uTurb;
varying vec3 vLocal;
varying vec3 vN;
varying vec3 vView;

${SIMPLEX_NOISE}

float fbm(vec3 p){
  float f = 0.0, a = 0.5;
  for(int i = 0; i < 5; i++){ f += a * snoise(p); p *= 2.1; a *= 0.5; }
  return f;
}

void main(){
  vec3 p = normalize(vLocal);
  // Roiling granulation: two noise fields drifting gently. Kept low-frequency
  // and slow so the plasma breathes without shimmering/aliasing frame to frame.
  float t = uTime * 0.14;
  float cells = fbm(p * 3.8 + vec3(0.0, t, 0.0));
  float fine = fbm(p * 6.5 - vec3(t * 0.5));
  float h = 0.5 + 0.5 * (cells * 0.78 + fine * 0.22);
  h = mix(0.5, h, uTurb + 0.45);

  // White-gold core → gold → hot orange, driven by the plasma field.
  vec3 col = mix(uMid, uCore, smoothstep(0.5, 0.95, h));
  col = mix(uEdge, col, smoothstep(0.15, 0.55, h));

  // Limb brightening (hot rim) so the disc reads as a glowing sphere.
  float fres = pow(1.0 - max(dot(vN, vView), 0.0), 2.2);
  col += uEdge * fres * 0.9;
  col *= 1.15; // overall lift so Bloom catches it

  gl_FragColor = vec4(col, 1.0);
}
`;

const CORONA_VERTEX = /* glsl */ `
varying vec3 vN;
varying vec3 vView;
void main(){
  vN = normalize(normalMatrix * normal);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`;

const CORONA_FRAGMENT = /* glsl */ `
precision highp float;
uniform vec3 uColor;
varying vec3 vN;
varying vec3 vView;
void main(){
  // Back-side shell: brightest at the silhouette, fading outward → soft halo.
  float rim = pow(1.0 - max(dot(vN, vView), 0.0), 2.6);
  gl_FragColor = vec4(uColor, rim * 0.6);
}
`;
