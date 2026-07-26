"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  Points,
  ShaderMaterial,
  SpriteMaterial,
} from "three";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { SIMPLEX_NOISE } from "#/components/three.js/planet/shaders";
import { SOLAR, SUN } from "./config";

type Props = {
  count?: number;
  animate?: boolean;
};

/**
 * The sun — a THICK ball of living dots: a dense particle body with a boiling,
 * granular surface (simplex noise animated on the GPU), a bright core fading
 * through orange to a deep red-orange limb, and a faint red CORONA / gas that
 * wisps beyond the surface. The particles are packed dense enough (SUN.count +
 * SUN.fill) that they fuse into a solid, thick disc rather than a sparse cloud
 * like the planets. Unlit + additively blended so it reads as emissive; a soft
 * glow-halo sprite behind it fills the gaps. Fades in with the system and spins
 * slowly on the real-time clock.
 */
const Sun = ({ count = SUN.count, animate = true }: Props) => {
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const glowRef = useRef<SpriteMaterial>(null);

  // Soft warm glow-halo (a camera-facing radial gradient) behind the grains, so
  // the sun reads as a solid glowing body, not a cloud of dots.
  const glow = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0.0, "rgba(255,216,150,0.85)");
      g.addColorStop(0.22, "rgba(255,120,44,0.45)");
      g.addColorStop(0.55, "rgba(200,52,16,0.16)");
      g.addColorStop(1.0, "rgba(120,24,6,0.0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
    }
    return new CanvasTexture(canvas);
  }, []);

  const { positions, colors, scales, seeds, shells } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const shells = new Float32Array(count); // 0 = surface, 1 = corona / gas

    const c = new Color();
    const core = new Color(SUN.core);
    const mid = new Color(SUN.mid);
    const edge = new Color(SUN.edge);
    const corona = new Color(SUN.corona);

    // The dense body reaches from `inner` out to the limb (1.0). A bigger
    // SUN.fill = a lower inner = a fuller, thicker sphere of dots.
    const inner = 1 - SUN.fill;

    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const dx = s * Math.cos(theta);
      const dy = u;
      const dz = s * Math.sin(theta);

      const isCorona = Math.random() < SUN.coronaFraction;
      shells[i] = isCorona ? 1 : 0;

      // Body: a dense ball, biased toward the surface so the limb is crisp but
      // the interior still fills in (thick). Corona: a faint outer gas glow.
      const rf = isCorona
        ? 1.0 + Math.pow(Math.random(), 1.6) * SUN.coronaReach
        : inner + Math.pow(Math.random(), 0.5) * SUN.fill;
      const r = SUN.radius * rf;
      positions[i * 3] = dx * r;
      positions[i * 3 + 1] = dy * r;
      positions[i * 3 + 2] = dz * r;

      if (isCorona) {
        c.copy(edge).lerp(corona, Math.random());
      } else {
        // Inner → outer surface: core → orange → deep red-orange limb.
        const t = (rf - inner) / SUN.fill; // 0 inner … 1 limb
        if (t < 0.55) c.copy(core).lerp(mid, t / 0.55);
        else c.copy(mid).lerp(edge, (t - 0.55) / 0.45);
      }
      const j = 0.85 + Math.random() * 0.3;
      colors[i * 3] = c.r * j;
      colors[i * 3 + 1] = c.g * j;
      colors[i * 3 + 2] = c.b * j;

      scales[i] = isCorona ? 0.7 + Math.random() * 1.1 : 0.6 + Math.random() * 0.7;
      seeds[i] = Math.random();
    }
    return { positions, colors, scales, seeds, shells };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: SUN.size },
      uPixelRatio: {
        value:
          typeof window !== "undefined"
            ? Math.min(window.devicePixelRatio, 2)
            : 1.5,
      },
      uReveal: { value: 0 },
      uGranulation: { value: SUN.granulation },
      uFlowSpeed: { value: SUN.flowSpeed },
      uSurfaceBoil: { value: SUN.surfaceBoil },
      uCoronaDrift: { value: SUN.coronaDrift },
      uCoronaFlicker: { value: SUN.coronaFlicker },
    }),
    []
  );

  useFrame((_, delta) => {
    const m = materialRef.current;
    if (!m) return;
    if (animate) {
      m.uniforms.uTime.value += delta;
      if (pointsRef.current) pointsRef.current.rotation.y += delta * SUN.spin;
    }
    const reveal = easeOutCubic(
      remap01(useVoyageScroll.getState().progress, SOLAR.revealStart, SOLAR.revealEnd)
    );
    m.uniforms.uReveal.value = reveal;
    if (glowRef.current) glowRef.current.opacity = reveal;
  });

  return (
    <group>
      <sprite scale={[SUN.radius * SUN.glowSize, SUN.radius * SUN.glowSize, 1]}>
        <spriteMaterial
          ref={glowRef}
          map={glow}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          opacity={0}
        />
      </sprite>
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
            attach="attributes-aShell"
            count={count}
            array={shells}
            itemSize={1}
            args={[shells, 1]}
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

export default Sun;

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uGranulation;
uniform float uFlowSpeed;
uniform float uSurfaceBoil;
uniform float uCoronaDrift;
uniform float uCoronaFlicker;
attribute vec3 aColor;
attribute float aScale;
attribute float aSeed;
attribute float aShell;
varying vec3 vColor;
varying float vBright;
varying float vShell;
varying float vSeed;

${SIMPLEX_NOISE}

void main(){
  vColor = aColor;
  vShell = aShell;
  vSeed = aSeed;

  vec3 nrm = normalize(position);
  vec3 p = position;
  float t = uTime * uFlowSpeed;

  // Boiling granulation on the surface; wispy outward drift for the corona/gas.
  float gran = snoise(position * uGranulation + vec3(0.0, 0.0, t));
  float wisp = snoise(position * 1.1 + vec3(t, t * 0.6, 0.0));
  // Surface: dimple INWARD only (never poke past the limb) so the silhouette
  // stays a clean round sphere — its life comes from the brightness boil below.
  // Outer edge: a low, gentle outward drift.
  float surfDisp = min(gran, 0.0) * uSurfaceBoil;
  p += nrm * mix(surfDisp, wisp * uCoronaDrift, aShell);

  // Granulation makes the surface boil (bright ↔ dim); the outer edge only
  // flickers gently (uCoronaFlicker), so it lives at a lower level.
  float surfB = 0.62 + 0.95 * (gran * 0.5 + 0.5);
  float coronaB = 0.4 + uCoronaFlicker * (wisp * 0.5 + 0.5);
  vBright = mix(surfB, coronaB, aShell);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  float tw = 0.85 + 0.15 * sin(uTime * 1.3 + aSeed * 6.2831);
  gl_PointSize = uSize * aScale * tw * uPixelRatio / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
precision highp float;
uniform float uReveal;
varying vec3 vColor;
varying float vBright;
varying float vShell;
varying float vSeed;

void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.08, d) * uReveal;
  // Corona particles are fainter — a soft gas glow / halo.
  a *= mix(1.0, 0.4, vShell);
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * vBright, a);
}
`;
