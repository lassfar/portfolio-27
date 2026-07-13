"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, BackSide, Color, ShaderMaterial } from "three";
import { SIMPLEX_NOISE } from "#/components/three.js/planet/shaders";
import { HAZE } from "./config";

type Props = {
  animate?: boolean;
};

/**
 * A very faint nebula / dust haze on a large shell enclosing the whole scene,
 * behind the stars. Procedural cloud patches in two dim, desaturated hues (cool
 * blue + warm dust) give deep space some atmosphere and depth without reading as
 * a loud sci-fi nebula. Additive + kept well under the Bloom threshold so it
 * glows softly rather than washing out.
 */
const DeepSpaceHaze = ({ animate = true }: Props) => {
  const materialRef = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: HAZE.intensity },
      uScale: { value: HAZE.scale },
      uColorA: { value: new Color(HAZE.colorA) },
      uColorB: { value: new Color(HAZE.colorB) },
    }),
    []
  );

  useFrame((_, delta) => {
    if (animate && materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta * HAZE.drift;
    }
  });

  return (
    <mesh>
      <sphereGeometry args={[HAZE.radius, 48, 48]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        side={BackSide}
        blending={AdditiveBlending}
        uniforms={uniforms}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
      />
    </mesh>
  );
};

export default DeepSpaceHaze;

// ── Shaders ──────────────────────────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float uTime;
uniform float uIntensity;
uniform float uScale;
uniform vec3 uColorA;
uniform vec3 uColorB;
varying vec3 vDir;

${SIMPLEX_NOISE}

float fbm(vec3 p){
  float f = 0.0, a = 0.5;
  for(int i = 0; i < 5; i++){ f += a * snoise(p); p *= 2.0; a *= 0.5; }
  return f;
}

void main(){
  vec3 p = vDir * uScale;
  // Cloud density, drifting slowly.
  float d = fbm(p + vec3(0.0, uTime, 0.0));
  d = smoothstep(0.05, 1.1, d);
  // Which hue this patch leans toward (independent field).
  float hue = 0.5 + 0.5 * fbm(p * 0.7 + 21.3);
  vec3 col = mix(uColorB, uColorA, hue);
  gl_FragColor = vec4(col, d * uIntensity);
}
`;
