"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  Mesh,
  ShaderMaterial,
} from "three";
import { clamp01, easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import {
  GALAXY,
  GALAXY_CENTER,
  GALAXY_SCALE,
  GALAXY_TILT,
  GALAXY_PALETTE as PAL,
} from "./config";
import { advanceSolarFly } from "./spin";

/**
 * The dotted, brand-tinted spiral galaxy — the finale. A single merged point cloud
 * (bulge, inter-arm disc, spiral arms with ridges + dust lanes, coral knots, halo,
 * faint dust) rendered in the site's "dot language" (additive, soft-round,
 * brightness-twinkle), plus a warm core-glow billboard.
 *
 * Built FLAT (in its own XZ plane): the inclined view comes from the camera
 * climbing above the disc during the pull-out (see CameraRig / GALAXY_ZOOM.endDir),
 * NOT from tilting the geometry — this matches the approved motion prototype. The
 * disc sits at `GALAXY_CENTER`, scaled by `GALAXY_SCALE` so the world origin (the
 * solar speck, "You are here") lands ~⅔ out in one arm. It turns gently on its own
 * axis; the CameraRig pulls the camera back to frame it. Reveal (and the subtree's
 * visibility, for perf) is driven by `useGalaxyScroll`.
 *
 * Dots are FIXED screen size (no `/-mv.z` term), so they stay crisp at every zoom
 * distance instead of ballooning when the camera is inside the disc.
 */

// ── seeded RNG + helpers (ported from the prototype so the look is identical) ──
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Build the merged galaxy geometry (deterministic for a given seed + count). */
function buildGalaxy(count: number): BufferGeometry {
  const rnd = mulberry32(GALAXY.seed);
  const TAU = Math.PI * 2;
  const gauss = (sigma: number) => {
    const u = 1 - rnd();
    const v = rnd();
    return sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v);
  };
  const smoothstep = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const dir = (): [number, number, number] => {
    const u = rnd() * 2 - 1;
    const th = rnd() * TAU;
    const s = Math.sqrt(1 - u * u);
    return [s * Math.cos(th), u, s * Math.sin(th)];
  };

  const C = {
    peach: new Color(PAL.peach),
    lpeach: new Color(PAL.lpeach),
    babyBlue: new Color(PAL.babyBlue),
    lbabyBlue: new Color(PAL.lbabyBlue),
    nebulaBlue: new Color(PAL.nebulaBlue),
    coral: new Color(PAL.coral),
    coreWhite: new Color(PAL.coreWhite),
  };
  const _c = new Color();

  const RMAX = GALAXY.discRadius;
  const H0 = GALAXY.discScaleLength;
  const R0 = 1.1;
  const RNORM = 1 - Math.exp(-RMAX / H0);
  const B = 1 / Math.tan((GALAXY.pitchDeg * Math.PI) / 180);
  const sampleRadius = () => -H0 * Math.log(1 - rnd() * RNORM);
  const hz = (r: number) =>
    GALAXY.discThickness * (0.6 + 0.4 * Math.exp(-r / (RMAX * 0.5)));
  const armAngle = (r: number, k: number) =>
    k * (TAU / GALAXY.armCount) + B * Math.log(Math.max(r, R0) / R0) + GALAXY.armPhase;
  const armColor = (rr: number): Color => {
    const t = Math.min(1, rr / RMAX);
    const ts = Math.min(1, Math.max(0, t + (rnd() - 0.5) * 0.12));
    if (ts < GALAXY.tWarm)
      return _c.copy(C.lpeach).lerp(C.peach, smoothstep(0, GALAXY.tWarm, ts));
    if (ts < GALAXY.tBlue)
      return _c.copy(C.peach).lerp(C.babyBlue, smoothstep(GALAXY.tWarm, GALAXY.tBlue, ts));
    _c.copy(C.babyBlue).lerp(C.lbabyBlue, (ts - GALAXY.tBlue) / (1 - GALAXY.tBlue));
    if (rnd() < 0.25) _c.lerp(C.nebulaBlue, 0.4);
    return _c;
  };

  const pos: number[] = [];
  const col: number[] = [];
  const scl: number[] = [];
  const bri: number[] = [];
  const sed: number[] = [];
  const push = (x: number, y: number, z: number, c: Color, s: number, b: number) => {
    pos.push(x, y, z);
    col.push(c.r, c.g, c.b);
    scl.push(s);
    bri.push(b);
    sed.push(rnd());
  };
  const jitter = () => 0.6 + rnd() * 0.8;
  const baseBright = () => 0.82 + rnd() * 0.32;
  const standout = (s: number, b: number): [number, number] =>
    rnd() < GALAXY.standoutFraction ? [s * 1.8, b * 1.5] : [s, b];

  // 1 — central bulge
  const nBulge = Math.round(count * 0.15);
  for (let i = 0; i < nBulge; i++) {
    const r = GALAXY.bulgeRadius * Math.pow(rnd(), 1.8);
    const d = dir();
    const c = _c.copy(C.lpeach).lerp(C.peach, r / GALAXY.bulgeRadius);
    const b = (1.0 + 0.6 * (1 - r / GALAXY.bulgeRadius)) * baseBright();
    push(d[0] * r, d[1] * r * GALAXY.bulgeFlatten, d[2] * r, c, 0.5 + rnd() * 0.5, b);
  }
  // 2 — inter-arm disc (uniform angle fills the gaps)
  const nDisc = Math.round(count * 0.2);
  for (let i = 0; i < nDisc; i++) {
    const r = sampleRadius();
    const phi = rnd() * TAU;
    const c = armColor(r);
    const so = standout(0.6 + rnd() * 0.4, baseBright() * 0.6);
    push(Math.cos(phi) * r, gauss(hz(r)), Math.sin(phi) * r, c, so[0], so[1]);
  }
  // 3 — spiral arms (log-spiral + fuzz + ridge + dust-lane)
  const nArm = Math.round(count * 0.5);
  let got = 0;
  let tries = 0;
  const maxTries = nArm * 3;
  while (got < nArm && tries < maxTries) {
    tries++;
    const r = sampleRadius();
    const k = Math.floor(rnd() * GALAXY.armCount);
    const sigmaPhi = GALAXY.armWidth / Math.max(r, R0);
    const dPhi = gauss(sigmaPhi);
    if (
      dPhi > -GALAXY.dustAt - GALAXY.dustWidth &&
      dPhi < -GALAXY.dustAt + GALAXY.dustWidth &&
      rnd() < GALAXY.dustDepth
    )
      continue; // dust lane — reject
    const phi = armAngle(r, k) + dPhi;
    const rr = Math.max(0, r + gauss(0.12 * r));
    const ridge = Math.exp(-(dPhi * dPhi) / (2 * Math.pow(0.45 * sigmaPhi, 2)));
    const c = _c.copy(armColor(rr));
    const so = standout(jitter() * (1 + 0.4 * ridge), baseBright() * (1 + GALAXY.ridgeGain * ridge));
    push(Math.cos(phi) * rr, gauss(hz(rr)), Math.sin(phi) * rr, c, so[0], so[1]);
    got++;
  }
  // 4 — star-forming knots (coral clusters on the arms)
  for (let kk = 0; kk < GALAXY.knotCount; kk++) {
    const r = (0.4 + rnd() * 0.5) * RMAX;
    const k = Math.floor(rnd() * GALAXY.armCount);
    const phi = armAngle(r, k);
    const cx = Math.cos(phi) * r;
    const cz = Math.sin(phi) * r;
    const cy = gauss(hz(r));
    for (let j = 0; j < GALAXY.dotsPerKnot; j++) {
      const c = _c.copy(C.coral).lerp(C.lpeach, rnd() * 0.6);
      let b = baseBright() * 1.5;
      const s = jitter() * 1.7;
      if (rnd() < 0.12) {
        c.copy(C.coreWhite);
        b *= 1.3;
      }
      push(cx + gauss(0.28), cy + gauss(0.12), cz + gauss(0.28), c, s, b);
    }
  }
  // 5 — outer halo (round, dim → volume)
  const nHalo = Math.round(count * 0.06);
  for (let i = 0; i < nHalo; i++) {
    const r = RMAX * (0.6 + 0.7 * Math.pow(rnd(), 2));
    const d = dir();
    const c = _c.copy(C.coreWhite).lerp(C.lbabyBlue, rnd());
    push(d[0] * r, d[1] * r * 0.85, d[2] * r, c, 0.4 + rnd() * 0.4, baseBright() * 0.4);
  }
  // 6 — faint disc dust (soft glow bed under the arms)
  const nDust = Math.round(count * 0.05);
  for (let i = 0; i < nDust; i++) {
    const r = sampleRadius();
    const phi = rnd() * TAU;
    const c = _c.copy(C.nebulaBlue).lerp(C.peach, r / RMAX);
    push(Math.cos(phi) * r, gauss(hz(r) * 1.4), Math.sin(phi) * r, c, 1.5 + rnd() * 1.2, baseBright() * 0.25);
  }

  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.setAttribute("aColor", new Float32BufferAttribute(col, 3));
  g.setAttribute("aScale", new Float32BufferAttribute(scl, 1));
  g.setAttribute("aBright", new Float32BufferAttribute(bri, 1));
  g.setAttribute("aSeed", new Float32BufferAttribute(sed, 1));
  return g;
}

const Galaxy = ({ animate = true }: { animate?: boolean }) => {
  const rootRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);
  const matRef = useRef<ShaderMaterial>(null);
  const coreRef = useRef<Mesh>(null);
  const coreMatRef = useRef<ShaderMaterial>(null);
  const camera = useThree((s) => s.camera);

  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const count = isSmall ? GALAXY.countMobile : GALAXY.count;
  const pixelRatio =
    typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1.5;

  const geometry = useMemo(() => buildGalaxy(count), [count]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: GALAXY.uSize },
      uPixelRatio: { value: pixelRatio },
      uTwinkleAmt: { value: GALAXY.twinkleAmount },
      uReveal: { value: 0 },
    }),
    [pixelRatio]
  );
  const coreUniforms = useMemo(() => ({ uOpacity: { value: 0 } }), []);

  useFrame((_, delta) => {
    const p = clamp01(useGalaxyScroll.getState().progress);
    const reveal = easeOutCubic(remap01(p, GALAXY.revealStart, GALAXY.revealEnd));
    if (rootRef.current) rootRef.current.visible = reveal > 0.001; // perf: no vertex work when hidden
    if (matRef.current) {
      matRef.current.uniforms.uReveal.value = reveal;
      if (animate) matRef.current.uniforms.uTime.value += delta;
    }
    // Core-glow blooms in LATER (while we look at the speck it stays quiet).
    if (coreMatRef.current) {
      const glow = remap01(p, GALAXY.coreGlowIn[0], GALAXY.coreGlowIn[1]);
      coreMatRef.current.uniforms.uOpacity.value = GALAXY.coreOpacity * glow;
    }
    if (animate && spinRef.current) spinRef.current.rotation.y += GALAXY.spinSpeed * delta;
    // Once fully framed, revolve the whole real solar system with the galaxy (it
    // flies through its arm — see galaxy/spin.ts + SolarSystem / Saturn / Earth).
    advanceSolarFly(delta, animate);
    if (coreRef.current) coreRef.current.quaternion.copy(camera.quaternion); // billboard the core-glow
  });

  return (
    <group
      ref={rootRef}
      position={GALAXY_CENTER}
      scale={GALAXY_SCALE}
      visible={false}
    >
      {/* Warm core-glow — a camera-facing additive plane at the galaxy centre. */}
      <mesh ref={coreRef} scale={GALAXY.coreScale * GALAXY.bulgeRadius}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          ref={coreMatRef}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={AdditiveBlending}
          uniforms={coreUniforms}
          vertexShader={CORE_VERT}
          fragmentShader={CORE_FRAG}
        />
      </mesh>

      {/* The disc, tilted to the locked look-study pose (inclination + roll baked in),
          turning gently on its own axis inside the tilt. */}
      <group rotation={GALAXY_TILT}>
        <group ref={spinRef}>
          <points geometry={geometry}>
            <shaderMaterial
              ref={matRef}
              transparent
              depthWrite={false}
              depthTest={false}
              blending={AdditiveBlending}
              uniforms={uniforms}
              vertexShader={GAL_VERT}
              fragmentShader={GAL_FRAG}
            />
          </points>
        </group>
      </group>
    </group>
  );
};

export default Galaxy;

const GAL_VERT = /* glsl */ `
uniform float uTime, uSize, uPixelRatio;
attribute vec3 aColor;
attribute float aScale, aBright, aSeed;
varying vec3 vColor;
varying float vTw;
void main(){
  vColor = aColor * aBright;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vTw = 0.5 + 0.5 * sin(uTime * 1.5 + aSeed * 6.2831);
  // FIXED screen size — constant px at every distance (crisp stars, never blobs).
  gl_PointSize = uSize * aScale * uPixelRatio;
  gl_Position = projectionMatrix * mv;
}
`;

const GAL_FRAG = /* glsl */ `
precision highp float;
uniform float uTwinkleAmt, uReveal;
varying vec3 vColor;
varying float vTw;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = pow(smoothstep(0.5, 0.12, d), 1.6);
  float b = (1.0 - uTwinkleAmt) + uTwinkleAmt * vTw;
  gl_FragColor = vec4(vColor * b, a * uReveal);
}
`;

const CORE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const CORE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uOpacity;
void main(){
  float dist = length(vUv - 0.5) * 2.0;
  float grad = pow(smoothstep(1.0, 0.0, dist), 1.7);
  vec3 col = mix(vec3(1.0, 0.94, 0.85), vec3(0.94, 0.55, 0.20), pow(dist, 0.7));
  gl_FragColor = vec4(col, grad * uOpacity);
}
`;
