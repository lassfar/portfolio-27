"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { Color, NormalBlending, Points, ShaderMaterial } from "three";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { remap01 } from "#/components/three.js/star/utils";
import { LIGHT, PLANET, PLANET_PALETTE, SCATTER } from "./config";
import { SIMPLEX_NOISE } from "./shaders";

type Props = {
  /** Particle count (set adaptively by the parent for perf). */
  count?: number;
  animate?: boolean;
};

/**
 * The planet body: a particle shell coloured into wavy latitude bands (the
 * peach family, with blue-grey polar caps) and lit by a single fixed light, so
 * it keeps a lit and a shadowed side as it spins. Churns on simplex noise for
 * the grainy, "dotty" surface.
 *
 * All palette / sizing live in `config.ts`. Freezes when `animate` is false.
 */
const PlanetBody = ({ count = PLANET.count, animate = true }: Props) => {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);

  const { positions, colors, scales, seeds, halos, scatters } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const halos = new Float32Array(count); // 0 = surface, 1 = dust halo
    const scatters = new Float32Array(count * 3); // dispersed-in-space home

    const c = new Color();
    const light = new Color(PLANET_PALETTE.bandLight);
    const mid = new Color(PLANET_PALETTE.bandMid);
    const dark = new Color(PLANET_PALETTE.bandDark);
    const deep = new Color(PLANET_PALETTE.bandDeep);
    const pole = new Color(PLANET_PALETTE.pole);

    for (let i = 0; i < count; i++) {
      // Uniform random direction on the unit sphere.
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const dx = s * Math.cos(theta);
      const dy = u; // latitude axis (-1 = south pole, +1 = north pole)
      const dz = s * Math.sin(theta);

      // A fraction of particles form a faint dust halo just outside the
      // surface; the rest are the grainy surface shell itself.
      const isHalo = Math.random() < PLANET.haloFraction;
      const radius = isHalo
        ? PLANET.radius * (1 + Math.pow(Math.random(), 1.5) * PLANET.haloThickness)
        : PLANET.radius * (1 + (Math.random() - 0.5) * PLANET.shellJitter);
      halos[i] = isHalo ? 1 : 0;

      positions[i * 3] = dx * radius;
      positions[i * 3 + 1] = dy * radius;
      positions[i * 3 + 2] = dz * radius;

      // Wavy latitude bands: longitude warps the stripe a little (gas-giant
      // churn) and a sine carves the alternating bands.
      const wave = Math.sin(theta * 3.0) * PLANET.bandWaviness;
      const stripe = Math.sin(dy * PLANET.bandFrequency + wave) * 0.5 + 0.5; // 0..1

      // Three-way warm ramp: deep → dark → mid → light across the stripe.
      if (stripe < 0.25) {
        c.copy(deep).lerp(dark, stripe / 0.25);
      } else if (stripe < 0.55) {
        c.copy(dark).lerp(mid, (stripe - 0.25) / 0.3);
      } else {
        c.copy(mid).lerp(light, (stripe - 0.55) / 0.45);
      }

      // Blue-grey polar caps.
      const polar = smoothstep(0.55, 0.92, Math.abs(dy));
      c.lerp(pole, polar * 0.8);

      // Per-particle brightness jitter → "noisy" grain.
      const j = 0.82 + Math.random() * 0.32;
      colors[i * 3] = c.r * j;
      colors[i * 3 + 1] = c.g * j;
      colors[i * 3 + 2] = c.b * j;

      scales[i] = 0.6 + Math.random() * 0.8;
      seeds[i] = Math.random();

      // Dispersed home: a random point in a wide box filling the view.
      scatters[i * 3] = (Math.random() - 0.5) * SCATTER.spread[0];
      scatters[i * 3 + 1] = (Math.random() - 0.5) * SCATTER.spread[1];
      scatters[i * 3 + 2] = (Math.random() - 0.5) * SCATTER.spread[2];
    }

    return { positions, colors, scales, seeds, halos, scatters };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: PLANET.size },
      uTurbulence: { value: PLANET.turbulence },
      uSwirl: { value: PLANET.swirl },
      uFlowSpeed: { value: PLANET.flowSpeed },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1.5,
      },
      uOpacity: { value: 1 },
      uLightDir: { value: LIGHT.dir },
      uAmbient: { value: LIGHT.ambient },
      uRimStart: { value: PLANET.rimStart },
      uRimScatter: { value: PLANET.rimScatter },
      uHaloOpacity: { value: PLANET.haloOpacity },
      uForm: { value: 0 }, // 0 = dispersed, 1 = assembled into Saturn
      uScatterDrift: { value: SCATTER.drift },
      uStagger: { value: SCATTER.stagger },
    }),
    []
  );

  useFrame((_, delta) => {
    const m = materialRef.current;
    if (!m) return;
    if (animate) m.uniforms.uTime.value += delta;
    // Assembly + fade-in are both driven by the shared progress, so the planet
    // is invisible during the star phase (progress 0), fades in as the star
    // bursts, then assembles. (Reduced motion leaves progress at 0 → hidden.)
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
          attach="attributes-aHalo"
          count={count}
          array={halos}
          itemSize={1}
          args={[halos, 1]}
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

export default PlanetBody;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** GLSL-style smoothstep for the JS-side colour ramps (polar-cap blend). */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// ── Shaders ──────────────────────────────────────────────────────────────────

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uTurbulence;
uniform float uSwirl;
uniform float uFlowSpeed;
uniform vec3 uLightDir;
uniform float uAmbient;
uniform float uRimStart;
uniform float uRimScatter;
uniform float uForm;         // 0 = dispersed in space, 1 = assembled
uniform float uScatterDrift;
uniform float uStagger;
attribute vec3 aColor;
attribute float aScale;
attribute float aSeed;
attribute float aHalo;       // 0 = surface, 1 = dust halo
attribute vec3 aScatter;     // dispersed-in-space home
varying vec3 vColor;
varying float vBright;
varying float vRim;
varying float vSeed;
varying float vHalo;

${SIMPLEX_NOISE}

void main(){
  vColor = aColor;
  vSeed = aSeed;
  vHalo = aHalo;

  vec3 nrm = normalize(position);
  vec3 p = position;

  // Fresnel rim from the UNdisplaced position: 0 facing camera → 1 at the edge.
  vec4 baseMV = modelViewMatrix * vec4(position, 1.0);
  vec3 viewNrm = normalize(normalMatrix * nrm);
  vec3 viewDir = normalize(-baseMV.xyz);
  float rim = 1.0 - abs(dot(viewNrm, viewDir));
  vRim = rim;

  // Living motion as ZONAL flow: rotate each particle east-west around the pole
  // (the Y axis) by a noise-varying angle. This preserves every particle's
  // latitude and radius, so the bands stay perfectly straight while streaming.
  float t = uTime * uFlowSpeed;
  float zonal = snoise(position * 1.4 + vec3(0.0, t, 0.0)) * uSwirl * (1.0 + aHalo);
  float ca = cos(zonal);
  float sa = sin(zonal);
  p.xz = mat2(ca, -sa, sa, ca) * p.xz;

  // A sliver of radial breathing keeps the surface alive (halo breathes more).
  float n = snoise(position * 2.2 + vec3(t));
  p += nrm * n * uTurbulence * (1.0 + aHalo * 2.0);

  // …then push surface particles near the rim outward → loose grainy edge.
  float rimMask = smoothstep(uRimStart, 1.0, rim) * (1.0 - aHalo);
  p += nrm * rimMask * aSeed * uRimScatter;

  // Directional lighting (surface keeps lit/shadowed sides; halo stays soft).
  float diff = max(dot(viewNrm, normalize(uLightDir)), 0.0);
  float litSurface = uAmbient + (1.0 - uAmbient) * diff;
  float litHalo = uAmbient + 0.25;
  vBright = mix(litSurface, litHalo, aHalo);

  // Scroll-driven assembly: blend from a dispersed point in space (gently
  // drifting) to the home position above. Per-particle stagger so they don't
  // all snap home at once (low-seed particles arrive first).
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

  float tw = 0.5 + 0.5 * sin(uTime * 1.5 + aSeed * 6.2831);
  gl_PointSize = uSize * aScale * (0.7 + tw * 0.4) * uPixelRatio / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float uOpacity;
uniform float uRimStart;
uniform float uHaloOpacity;
varying vec3 vColor;
varying float vBright;
varying float vRim;
varying float vSeed;
varying float vHalo;

void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.12, d);

  // Grainy rim dissolve (surface): higher-seed dots near the edge fade out,
  // so the silhouette breaks into loose grain instead of a hard circle.
  float rimMask = smoothstep(uRimStart, 1.0, vRim);
  float surfaceFade = 1.0 - rimMask * vSeed * 0.85;

  // Halo particles are uniformly faint dust.
  float alpha = a * mix(surfaceFade, uHaloOpacity, vHalo) * uOpacity;
  if (alpha < 0.003) discard;

  gl_FragColor = vec4(vColor * vBright, alpha);
}
`;
