"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, NormalBlending, Points, ShaderMaterial } from "three";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { remap01 } from "#/components/three.js/star/utils";
import { RING, RING_PALETTE, SCATTER } from "./config";
import { SIMPLEX_NOISE } from "./shaders";

type Props = {
  /** Particle count (set adaptively by the parent for perf). */
  count?: number;
  animate?: boolean;
};

/**
 * The rings: a razor-thin particle disk in the equatorial plane, with the
 * Cassini division (an empty gap band) and fine radial brightness banding.
 * Icy — pale baby-blue fading to white. Unlit (full colour), with a faint
 * shimmer. Freezes when `animate` is false.
 */
const Rings = ({ count = RING.count, animate = true }: Props) => {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const { positions, colors, scales, seeds, scatters } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const scatters = new Float32Array(count * 3); // dispersed-in-space home

    const c = new Color();
    const tint = new Color(RING_PALETTE.tint);
    const bright = new Color(RING_PALETTE.bright);
    const dim = new Color(RING_PALETTE.dim);

    const span = RING.outer - RING.inner;
    for (let i = 0; i < count; i++) {
      // Area-uniform radius, rejecting the Cassini gap.
      let r: number;
      do {
        r = RING.inner + Math.sqrt(Math.random()) * span;
      } while (r > RING.cassiniStart && r < RING.cassiniEnd);

      const a = Math.random() * Math.PI * 2;
      positions[i * 3] = Math.cos(a) * r;
      positions[i * 3 + 1] = (Math.random() - 0.5) * RING.thickness;
      positions[i * 3 + 2] = Math.sin(a) * r;

      // Fine radial brightness banding + icy tint variation.
      const band = Math.sin(r * RING.bandFrequency) * 0.5 + 0.5;
      const edgeFade =
        smoothstep(RING.inner, RING.inner + 0.12, r) *
        (1 - smoothstep(RING.outer - 0.18, RING.outer, r));
      c.copy(dim).lerp(tint, band);
      c.lerp(bright, band * band * 0.6);
      const b = (0.55 + band * 0.6) * (0.4 + edgeFade * 0.6);

      colors[i * 3] = c.r * b;
      colors[i * 3 + 1] = c.g * b;
      colors[i * 3 + 2] = c.b * b;

      scales[i] = 0.5 + Math.random() * 0.7;
      seeds[i] = Math.random();

      // Dispersed home: a random point in a wide box filling the view.
      scatters[i * 3] = (Math.random() - 0.5) * SCATTER.spread[0];
      scatters[i * 3 + 1] = (Math.random() - 0.5) * SCATTER.spread[1];
      scatters[i * 3 + 2] = (Math.random() - 0.5) * SCATTER.spread[2];
    }

    return { positions, colors, scales, seeds, scatters };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: RING.size },
      uShimmer: { value: RING.shimmer },
      uFlowSpeed: { value: RING.flowSpeed },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1.5,
      },
      uOpacity: { value: 1 },
      uForm: { value: 0 }, // 0 = dispersed, 1 = assembled into the ring
      uScatterDrift: { value: SCATTER.drift },
      uStagger: { value: SCATTER.stagger },
    }),
    []
  );

  useFrame((_, delta) => {
    const m = materialRef.current;
    if (!m) return;
    if (animate) m.uniforms.uTime.value += delta;
    // Assembly + fade-in driven by the shared progress (hidden during the star
    // phase, fades in as the star bursts, then assembles into the ring).
    const progress = useAboutScroll.getState().progress;
    m.uniforms.uForm.value = progress;
    m.uniforms.uOpacity.value = remap01(progress, 0.0, 0.15);
  });

  return (
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
        <bufferAttribute
          attach="attributes-aScatter"
          count={count}
          array={scatters}
          itemSize={3}
          args={[scatters, 3]}
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
  );
};

export default Rings;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** GLSL-style smoothstep for the JS-side ring edge fade. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ── Shaders ──────────────────────────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uShimmer;
uniform float uFlowSpeed;
uniform float uForm;         // 0 = dispersed in space, 1 = assembled
uniform float uScatterDrift;
uniform float uStagger;
attribute vec3 aColor;
attribute float aScale;
attribute float aSeed;
attribute vec3 aScatter;     // dispersed-in-space home
varying vec3 vColor;
varying float vTwinkle;

${SIMPLEX_NOISE}

void main(){
  vColor = aColor;

  // In-plane shimmer (x/z only) — particles drift and sparkle within the ring
  // plane, so it stays flat and refined (no vertical waving).
  vec3 p = position;
  float t = uTime * uFlowSpeed;
  p.x += snoise(position * 2.0 + vec3(t, 0.0, 0.0)) * uShimmer;
  p.z += snoise(position * 2.0 + vec3(0.0, 5.0, t)) * uShimmer;

  // Scroll-driven assembly: blend from a dispersed, gently drifting point in
  // space to the ring home, staggered per particle.
  vec3 home = p;
  float ds = uTime * 0.05;
  vec3 scattered = aScatter + vec3(
    snoise(aScatter * 0.5 + vec3(ds, 0.0, 0.0)),
    snoise(aScatter * 0.5 + vec3(0.0, ds + 4.0, 0.0)),
    snoise(aScatter * 0.5 + vec3(0.0, 0.0, ds + 8.0))
  ) * uScatterDrift;
  float f = clamp((uForm - aSeed * uStagger) / (1.0 - uStagger), 0.0, 1.0);
  f = f * f * (3.0 - 2.0 * f);
  p = mix(scattered, home, f);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);

  float tw = 0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 6.2831);
  vTwinkle = tw;

  gl_PointSize = uSize * aScale * (0.6 + tw * 0.5) * uPixelRatio / -mvPosition.z;
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
  float a = smoothstep(0.5, 0.12, d);
  gl_FragColor = vec4(vColor * (0.7 + vTwinkle * 0.5), a * uOpacity);
}
`;
