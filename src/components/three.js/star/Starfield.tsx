"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, Points, ShaderMaterial } from "three";
import { STARFIELD } from "./config";
import { clamp01, remap01 } from "./utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useDrawGate } from "#/components/three.js/scene/useDrawGate";

/** Galaxy-beat window over which this near, camera-pinned field fades out, leaving
 *  only the galaxy's own (world-fixed) stars as the space around you. It lingers
 *  through the "solar system fully visible" beat, then hands off to the galaxy as it
 *  resolves (overlaps GALAXY.revealStart..revealEnd). */
const GALAXY_FADE: [number, number] = [0.2, 0.55];

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
 * is a soft round glow that shimmers gently; the brightest standouts sparkle instead,
 * like stars in a space photo — the galaxy finale's sparkle, smaller (STARFIELD.sparkle).
 * Only the BRIGHTNESS twinkles (never the point size), so nothing sub-pixel flickers
 * under motion.
 */
const Starfield = ({ count = STARFIELD.count, animate = true }: Props) => {
  const materialRef = useRef<ShaderMaterial>(null);
  const pointsRef = useRef<Points>(null);
  // Once it has faded into the galaxy finale its stars output nothing — skip the draw.
  useDrawGate(pointsRef, () => (materialRef.current?.uniforms.uReveal.value ?? 1) > 0);

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
      uReveal: { value: 1 },
      // The sparkling stars (STARFIELD.sparkle) — set each frame (the dev panel tunes them).
      uSparkFrom: { value: 2 },
      uSparkSize: { value: 1 },
      uSpikes: { value: 1 },
      uRayWidth: { value: 1 },
      uCoreSize: { value: 1 },
      uHalo: { value: 0 },
      uHaloSize: { value: 1 },
      uPulseSpeed: { value: 0 },
      uPulseAmount: { value: 0 },
      uStandoutSize: { value: STARFIELD.brightSize },
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
    if (!materialRef.current) return;
    const u = materialRef.current.uniforms;
    if (animate) u.uTime.value += delta;
    // Live values (the dev panel tunes STARFIELD in place).
    const S = STARFIELD.sparkle;
    u.uTwinkleSpeed.value = STARFIELD.twinkleSpeed;
    u.uTwinkleAmount.value = STARFIELD.twinkleAmount;
    // The brightest standouts sparkle: standouts are 1.1–1.6 bright (the rest ≤ 0.9),
    // so this picks the top `share` of them — the same stars whatever the share.
    u.uSparkFrom.value = 1.1 + 0.5 * (1 - S.share) - 1e-6;
    u.uSparkSize.value = S.size;
    u.uSpikes.value = S.spikes;
    u.uRayWidth.value = S.rayWidth;
    u.uCoreSize.value = S.coreSize;
    u.uHalo.value = S.halo;
    u.uHaloSize.value = S.haloSize;
    u.uPulseSpeed.value = S.pulseSpeed;
    u.uPulseAmount.value = S.pulseAmount;
    // Fade this near field out as the galaxy finale flies the camera out — the
    // galaxy's own stars become the space around you (no doubled starfield).
    const galaxy = clamp01(useGalaxyScroll.getState().progress);
    materialRef.current.uniforms.uReveal.value =
      1 - remap01(galaxy, GALAXY_FADE[0], GALAXY_FADE[1]);
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
uniform float uSparkFrom;
uniform float uSparkSize;
uniform float uStandoutSize;
uniform float uPulseSpeed;
uniform float uPulseAmount;
attribute vec3 aColor;
attribute float aScale;
attribute float aBright;
attribute float aSeed;
varying vec3 vColor;
varying float vBright;
varying float vSpark; // 1 = a sparkling star
varying float vSpritePx; // a sparkling star's sprite, in CSS px

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

  // A sparkling star: the galaxy finale's sparkle — a fixed on-screen sprite (bigger
  // for the bigger standouts), with an optional slow pulse (STARFIELD.sparkle).
  vSpark = step(uSparkFrom, aBright) * step(0.0001, 1.6 - uSparkFrom);
  vSpritePx = 0.0;
  if (vSpark > 0.5) {
    float grow = clamp((aScale - 1.4) / uStandoutSize, 0.0, 1.0);
    vSpritePx = uSparkSize * (0.45 + 0.55 * grow);
    gl_PointSize = vSpritePx * uPixelRatio;
    vBright = 1.0 - uPulseAmount + uPulseAmount * sin(uTime * uPulseSpeed + aSeed * 6.2831);
  }
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float uReveal;
uniform float uSpikes;
uniform float uRayWidth;
uniform float uCoreSize;
uniform float uHalo;
uniform float uHaloSize;
varying vec3 vColor;
varying float vBright;
varying float vSpark;
varying float vSpritePx;

void main(){
  if (vSpark > 0.5) {
    // The galaxy finale's sparkle (galaxy/shaders.ts SPARKLE_FRAG): a sharp core, a
    // soft halo and a hairline 4-ray cross fading to the tips. Its widths are set in
    // screen px with smooth (gaussian) profiles: these sprites are small and drift
    // with the cosmos, and the galaxy's sub-pixel hairlines would drop between pixel
    // rows and flicker. It's drawn there in screen values, capped at white by its
    // layer, so it's capped and brought to this (linear) scene's light the same way
    // (^2.2) — never brighter than white, so the site's bloom can't swell it into a
    // round glow.
    vec2 p = gl_PointCoord - 0.5;
    vec2 q = p * vSpritePx; // CSS px from the centre
    float rr = dot(q, q);
    float core = exp(-rr / (2.0 * uCoreSize * uCoreSize));
    float halo = exp(-rr / (2.0 * uHaloSize * uHaloSize)) * uHalo;
    vec2 line = exp(-q * q / (2.0 * uRayWidth * uRayWidth)); // ray cross-section
    float sx = line.y * pow(max(0.0, 1.0 - abs(p.x) * 2.0), 2.0);
    float sy = line.x * pow(max(0.0, 1.0 - abs(p.y) * 2.0), 2.0);
    float s = pow(min(core + halo + uSpikes * (sx + sy), 1.0), 2.2) * vBright * uReveal;
    if (s < 0.0005) discard;
    gl_FragColor = vec4(vColor, s);
    return;
  }
  // Soft round star: a bright core fading to a gentle glow.
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  a = pow(a, 1.6);
  gl_FragColor = vec4(vColor * vBright, a * vBright * uReveal);
}
`;
