"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, ShaderMaterial } from "three";
import { STARFIELD } from "./config";

type Props = {
  count?: number;
  animate?: boolean;
};

/** Weighted pick of a tint index (biased toward the near-white tints). */
const pickTint = (): number => {
  const w = STARFIELD.tintWeights;
  const total = w.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < w.length; i++) {
    r -= w[i];
    if (r <= 0) return i;
  }
  return w.length - 1;
};

/**
 * A field of stars in a spherical shell around the camera — varied by realistic
 * stellar temperature colour (hot blue-white → white → gold → amber), size and
 * brightness, with a few bright standouts among a lot of faint dust. Each star
 * is a soft round glow that shimmers gently. Only the BRIGHTNESS twinkles (never
 * the point size), so nothing sub-pixel flickers under motion.
 */
const Starfield = ({ count = STARFIELD.count, animate = true }: Props) => {
  const materialRef = useRef<ShaderMaterial>(null);

  const { positions, colors, scales, brights, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const brights = new Float32Array(count);
    const seeds = new Float32Array(count);

    const c = new Color();
    for (let i = 0; i < count; i++) {
      const radius = STARFIELD.minRadius + Math.random() * STARFIELD.radiusSpread;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      c.set(STARFIELD.tints[pickTint()]);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      // A few rare, larger + brighter "standout" stars among lots of faint dust.
      const standout = Math.random() < STARFIELD.brightFraction;
      scales[i] = standout
        ? 1.4 + Math.random() * STARFIELD.brightSize
        : 0.5 + Math.random() * 0.7;
      brights[i] = standout
        ? 1.1 + Math.random() * 0.5
        : 0.3 + Math.random() * 0.6;
      seeds[i] = Math.random();
    }

    return { positions, colors, scales, brights, seeds };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: STARFIELD.size },
      uTwinkleSpeed: { value: STARFIELD.twinkleSpeed },
      uTwinkleAmount: { value: STARFIELD.twinkleAmount },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1.5,
      },
    }),
    []
  );

  // Only the twinkle animates here; the parent (Universe) owns the rotation so
  // the whole cosmos turns together.
  useFrame((_, delta) => {
    if (animate && materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }
  });

  return (
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
          attach="attributes-aBright"
          count={count}
          array={brights}
          itemSize={1}
          args={[brights, 1]}
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
  );
};

export default Starfield;

// ── Shaders ──────────────────────────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uTwinkleSpeed;
uniform float uTwinkleAmount;
attribute vec3 aColor;
attribute float aScale;
attribute float aBright;
attribute float aSeed;
varying vec3 vColor;
varying float vBright;

void main(){
  vColor = aColor;

  // Twinkle the BRIGHTNESS only (never the size) so nothing goes sub-pixel and
  // flickers. Each star cycles on its own phase.
  float tw = 0.5 + 0.5 * sin(uTime * uTwinkleSpeed + aSeed * 6.2831);
  vBright = aBright * (1.0 - uTwinkleAmount + uTwinkleAmount * tw);

  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  // Distance-attenuated size, clamped to ≥1px so faint stars never flicker.
  gl_PointSize = max(uSize * aScale * uPixelRatio / -mv.z, 1.0);
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
varying vec3 vColor;
varying float vBright;

void main(){
  // Soft round star: a bright core fading to a gentle glow.
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a = pow(a, 1.6);
  gl_FragColor = vec4(vColor * vBright, a * vBright);
}
`;
