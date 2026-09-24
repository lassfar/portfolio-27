"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  CanvasTexture,
  Color,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
} from "three";
import { SIMPLEX_NOISE } from "#/components/three.js/planet/shaders";
import { SUN, SUN_CORE } from "./config";

type Props = {
  count: number;
  /** Bumped by the dev panel when a shape value changes — rebuilds the dots. */
  version: number;
  animate: boolean;
  /** The Sun's clock + reveal (shared with the dotted shell, so they stay in step). */
  time: { value: number };
  reveal: { value: number };
  /** Draw order of the body + corona dots (the halo draws just before them). */
  renderOrder: number;
};

/**
 * The original Sun, kept inside and around the dotted shell:
 *
 *   • its BODY — a dense volume of dots filling the sphere, bright warm-white at the
 *     centre → orange → deep red-orange toward the edge, with a slowly boiling
 *     brightness: a glowing 3D volume (not a flat disc) seen through the shell's gaps;
 *   • its CORONA — living dots drifting in a loose cloud just outside the sphere,
 *     wisping gently in and out and flickering, orange → deep red;
 *   • its soft warm HALO — a camera-facing glow sprite around it all.
 *
 * Additive, so the grains fuse into light. Same recipe + values as the original Sun.
 * Every value is live-tunable from the dev panel (SunGui); shape values rebuild the dots.
 */
const SunCore = ({ count, version, animate, time, reveal, renderOrder }: Props) => {
  const pointsRef = useRef<Points>(null);
  const haloRef = useRef<Sprite>(null);
  const haloMatRef = useRef<SpriteMaterial>(null);
  const dpr = useThree((s) => s.viewport.dpr);

  // The soft warm halo (a radial gradient), as the original Sun's.
  const halo = useMemo(() => {
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
  useEffect(() => () => halo.dispose(), [halo]);

  const geometry = useMemo(() => {
    const bodyRadius = SUN.radius * SUN_CORE.radiusScale; // just inside the dotted shell
    const positions = new Float32Array(count * 3);
    // Where each dot sits on its colour gradient (the colours themselves are live
    // uniforms): body = centre (0) → edge (1); corona = edge colour (0) → corona colour (1).
    const tones = new Float32Array(count);
    const jitters = new Float32Array(count); // a little brightness variety
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const shells = new Float32Array(count); // 0 = body, 1 = corona
    // The body reaches from `inner` out to its edge; fill 1 = all the way to the centre.
    const inner = 1 - SUN_CORE.fill;
    for (let i = 0; i < count; i++) {
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const isCorona = Math.random() < SUN_CORE.coronaFraction;
      shells[i] = isCorona ? 1 : 0;
      // Body: biased toward its edge so it's full, while the inside still fills in.
      // Corona: a loose cloud beyond the (full-size) sphere.
      const r = isCorona
        ? SUN.radius * (1.0 + Math.pow(Math.random(), 1.6) * SUN_CORE.coronaReach)
        : bodyRadius * (inner + Math.pow(Math.random(), 0.5) * SUN_CORE.fill);
      positions[i * 3] = s * Math.cos(theta) * r;
      positions[i * 3 + 1] = u * r;
      positions[i * 3 + 2] = s * Math.sin(theta) * r;
      // Body: inner → outer (warm-white core → orange → deep red-orange).
      tones[i] = isCorona ? Math.random() : (r / bodyRadius - inner) / SUN_CORE.fill;
      jitters[i] = 0.85 + Math.random() * 0.3;
      scales[i] = isCorona ? 0.7 + Math.random() * 1.1 : 0.6 + Math.random() * 0.7;
      seeds[i] = Math.random();
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(positions, 3));
    g.setAttribute("aTone", new Float32BufferAttribute(tones, 1));
    g.setAttribute("aJitter", new Float32BufferAttribute(jitters, 1));
    g.setAttribute("aScale", new Float32BufferAttribute(scales, 1));
    g.setAttribute("aSeed", new Float32BufferAttribute(seeds, 1));
    g.setAttribute("aShell", new Float32BufferAttribute(shells, 1));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` rebuilds from the tuned SUN / SUN_CORE
  }, [count, version]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uTime: time,
          uReveal: reveal,
          uSize: { value: SUN_CORE.size },
          uPixelRatio: { value: 1 },
          uGranulation: { value: SUN_CORE.granulation },
          uFlowSpeed: { value: SUN_CORE.flowSpeed },
          uSurfaceBoil: { value: SUN_CORE.surfaceBoil },
          uCoronaDrift: { value: SUN_CORE.coronaDrift },
          uCoronaFlicker: { value: SUN_CORE.coronaFlicker },
          uBodyAmount: { value: SUN_CORE.bodyStrength },
          uCoronaAmount: { value: SUN_CORE.coronaStrength },
          uCore: { value: new Color(SUN_CORE.core) },
          uMid: { value: new Color(SUN_CORE.mid) },
          uEdge: { value: new Color(SUN_CORE.edge) },
          uCorona: { value: new Color(SUN_CORE.corona) },
          uSplit: { value: SUN_CORE.gradientSplit },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
      }),
    [time, reveal]
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    // Live values (the dev panel tunes SUN_CORE in place).
    const u = material.uniforms;
    u.uPixelRatio.value = dpr;
    u.uSize.value = SUN_CORE.size;
    u.uGranulation.value = SUN_CORE.granulation;
    u.uFlowSpeed.value = SUN_CORE.flowSpeed;
    u.uSurfaceBoil.value = SUN_CORE.surfaceBoil;
    u.uCoronaDrift.value = SUN_CORE.coronaDrift;
    u.uCoronaFlicker.value = SUN_CORE.coronaFlicker;
    u.uBodyAmount.value = SUN_CORE.bodyStrength;
    u.uCoronaAmount.value = SUN_CORE.coronaStrength;
    u.uCore.value.set(SUN_CORE.core);
    u.uMid.value.set(SUN_CORE.mid);
    u.uEdge.value.set(SUN_CORE.edge);
    u.uCorona.value.set(SUN_CORE.corona);
    u.uSplit.value = SUN_CORE.gradientSplit;
    if (animate && !SUN.paused && pointsRef.current) pointsRef.current.rotation.y += delta * SUN_CORE.spin;
    if (haloRef.current) {
      const size = SUN.radius * SUN_CORE.glowSize;
      haloRef.current.scale.set(size, size, 1);
    }
    if (haloMatRef.current) {
      haloMatRef.current.opacity = reveal.value * SUN_CORE.haloStrength;
      haloMatRef.current.color.set(SUN_CORE.haloTint);
    }
  });

  return (
    <>
      <sprite ref={haloRef} renderOrder={renderOrder - 1}>
        <spriteMaterial
          ref={haloMatRef}
          map={halo}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          opacity={0}
        />
      </sprite>
      <points
        ref={pointsRef}
        geometry={geometry}
        material={material}
        renderOrder={renderOrder}
        frustumCulled={false}
      />
    </>
  );
};

export default SunCore;

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uGranulation;
uniform float uFlowSpeed;
uniform float uSurfaceBoil;
uniform float uCoronaDrift;
uniform float uCoronaFlicker;
uniform vec3 uCore, uMid, uEdge, uCorona;
uniform float uSplit;
attribute float aTone;
attribute float aJitter;
attribute float aScale;
attribute float aSeed;
attribute float aShell;
varying vec3 vColor;
varying float vBright;
varying float vShell;

${SIMPLEX_NOISE}

void main(){
  // Body: centre → middle colour (at uSplit) → edge. Corona: edge → corona colour.
  vec3 body = aTone < uSplit
    ? mix(uCore, uMid, aTone / max(uSplit, 0.001))
    : mix(uMid, uEdge, (aTone - uSplit) / max(1.0 - uSplit, 0.001));
  vColor = mix(body, mix(uEdge, uCorona, aTone), aShell) * aJitter;
  vShell = aShell;
  vec3 nrm = normalize(position);
  vec3 p = position;
  float t = uTime * uFlowSpeed;
  // The boil for the body; a wispy outward drift for the corona cloud.
  float gran = snoise(position * uGranulation + vec3(0.0, 0.0, t));
  float wisp = snoise(position * 1.1 + vec3(t, t * 0.6, 0.0));
  // Body: dimple INWARD only (the round shape holds). Corona: a low, gentle drift.
  float surfDisp = min(gran, 0.0) * uSurfaceBoil;
  p += nrm * mix(surfDisp, wisp * uCoronaDrift, aShell);
  // The body boils (bright ↔ dim); the corona only flickers gently.
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
uniform float uBodyAmount;
uniform float uCoronaAmount;
varying vec3 vColor;
varying float vBright;
varying float vShell;

void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.08, d) * uReveal;
  // The corona dots are fainter — a soft gas cloud. (× each part's strength)
  a *= mix(uBodyAmount, 0.4 * uCoronaAmount, vShell);
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor * vBright, a);
}
`;
