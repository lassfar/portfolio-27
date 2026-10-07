"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  MeshBasicMaterial,
  NormalBlending,
  PerspectiveCamera,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useSaturnAnchor } from "#/stores/useSaturnAnchor";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { easeInOutCubic, remap01 } from "#/components/three.js/star/utils";
import { flyingSunPos } from "#/components/three.js/galaxy/spin";
import { FLYOUT, GROWTH, LIGHT, PLANET, PLANET_PALETTE, SCATTER, saturnLod } from "./config";
import { PLANET_LOD, PLANET_STYLE, SOLAR, VOYAGE } from "#/components/three.js/solar/config";
import { PERFORMANCE } from "#/components/three.js/scene/performance";
import { SIMPLEX_NOISE } from "./shaders";
import { useDrawGate } from "#/components/three.js/scene/useDrawGate";
import { pointPixelRatio } from "#/components/three.js/scene/quality";
import { sceneBuilds } from "#/components/three.js/scene/sceneBuilds";
import { JOURNEY } from "#/components/three.js/star/config";

const _center = new Vector3(); // scratch (level of detail)

/** Saturn's dots, as flat arrays (one entry per dot, ×3 for vectors). */
type SaturnDots = {
  positions: Float32Array;
  colors: Float32Array;
  scales: Float32Array;
  seeds: Float32Array;
  halos: Float32Array; // 0 = surface, 1 = dust halo
  scatters: Float32Array; // dispersed-in-space home
};

/** Dots built per step of the build queue (~a fraction of a ms each). */
const BUILD_STEP = 2000;
/** Where the planet first shows: as it starts assembling (master progress). */
const SATURN_SHOWS_AT = JOURNEY.assembleStart * JOURNEY.journeyEnd;

function allocateDots(count: number): SaturnDots {
  return {
    positions: new Float32Array(count * 3),
    colors: new Float32Array(count * 3),
    scales: new Float32Array(count),
    seeds: new Float32Array(count),
    halos: new Float32Array(count),
    scatters: new Float32Array(count * 3),
  };
}

/** Build the dots into `out`, pausing every BUILD_STEP dots (see sceneBuilds). */
function* buildDots(count: number, out: SaturnDots) {
  const { positions, colors, scales, seeds, halos, scatters } = out;
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

    if ((i + 1) % BUILD_STEP === 0) yield;
  }
}

function toGeometry(dots: SaturnDots): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(dots.positions, 3));
  g.setAttribute("aColor", new BufferAttribute(dots.colors, 3));
  g.setAttribute("aScale", new BufferAttribute(dots.scales, 1));
  g.setAttribute("aSeed", new BufferAttribute(dots.seeds, 1));
  g.setAttribute("aHalo", new BufferAttribute(dots.halos, 1));
  g.setAttribute("aScatter", new BufferAttribute(dots.scatters, 3));
  return g;
}

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
  // Before it assembles and once it has faded out (from the Earth dive on), its shader
  // discards every dot (no colour, no depth) — skip the draw. (The rings aren't gated:
  // their invisible grains still write depth, which is part of the explosion's look.)
  useDrawGate(pointsRef, () => (materialRef.current?.uniforms.uOpacity.value ?? 1) > 0);
  const coreRef = useRef<Mesh>(null); // the solid core under the dots
  const coreMatRef = useRef<MeshBasicMaterial>(null);

  // Its 70k dots are built in idle time, in story order (P27-78): the planet only shows
  // ~2 screens into the page, so they needn't hold up the first frame. Until then an
  // empty geometry stands in (it draws nothing).
  const placeholder = useMemo(() => new BufferGeometry(), []);
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  useEffect(() => {
    const dots = allocateDots(count);
    return sceneBuilds.add({
      name: "Saturn",
      neededAt: SATURN_SHOWS_AT,
      steps: buildDots(count, dots),
      onDone: () => setGeometry(toGeometry(dots)),
    });
  }, [count]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => placeholder.dispose(), [placeholder]);

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
      uSunDir: { value: new Vector3(0, 0, 1) }, // view-space direction to the real Sun
      uSunLight: { value: 0 }, // 0 = the About light → 1 = lit by the real Sun
      uSunAmbient: { value: PLANET_STYLE.ambient }, // its night side once Sun-lit
      uRimStart: { value: PLANET.rimStart },
      uRimScatter: { value: PLANET.rimScatter },
      uHaloOpacity: { value: PLANET.haloOpacity },
      uForm: { value: 0 }, // 0 = dispersed, 1 = assembled into Saturn
      uScatterDrift: { value: SCATTER.drift },
      uStagger: { value: SCATTER.stagger },
      uStartScale: { value: GROWTH.startScale },
      uOvershoot: { value: GROWTH.overshoot },
      uThin: { value: 0 }, // 0 = full cloud, 1 = fully thinned away (fly-away)
      uCullBack: { value: 0 }, // 1 = drop the dots hidden behind the core (set below)
      uCoreRadius: { value: PLANET.radius * PLANET.coreScale * 0.98 }, // (a hair inside)
      uCamLocal: { value: new Vector3() }, // the camera, in the planet's own space
      uLodCount: { value: 1e9 }, // level of detail (every dot until set each frame)
      uLodFade: { value: PLANET_LOD.fadeBand },
    }),
    []
  );

  useFrame((state, delta) => {
    const m = materialRef.current;
    if (!m) return;
    // Dots keep their on-screen size at any canvas resolution (the quality tiers).
    m.uniforms.uPixelRatio.value = pointPixelRatio(state.viewport.dpr);
    if (animate) m.uniforms.uTime.value += delta;
    // Assembly + fade-in are both driven by the shared progress, so the planet
    // is invisible during the star phase (progress 0), fades in as the star
    // bursts, then assembles. (Reduced motion leaves progress at 0 → hidden.)
    const progress = useAboutScroll.getState().progress;
    m.uniforms.uForm.value = progress;
    const voyage = useVoyageScroll.getState().progress;
    // Fade the Saturn OUT as we dive to Earth, exactly like the rest of the system
    // (opacity, NOT scale — the planet keeps its size and just fades away).
    const earthFade = remap01(voyage, VOYAGE.earthFadeStart, VOYAGE.earthFadeEnd);
    m.uniforms.uOpacity.value = remap01(progress, 0.0, 0.15) * (1.0 - earthFade);
    // Formed, with its core opaque: the dots behind the core are dropped in the vertex
    // shader (P27-78), tested against the camera in the planet's own space.
    const formed = progress >= 0.999 && m.uniforms.uOpacity.value >= 0.999;
    m.uniforms.uCullBack.value = formed ? 1 : 0;
    if (formed && pointsRef.current) {
      pointsRef.current.updateWorldMatrix(true, false);
      pointsRef.current.worldToLocal(m.uniforms.uCamLocal.value.copy(state.camera.position));
    }

    // Level of detail, once assembled (P27-78): like the planets, no more dots than its
    // disc can show on screen (PLANET_LOD.maxDotsPerPx), so a small, far Saturn draws a
    // fraction of its dots. The rings follow the same share.
    let drawn = count;
    const points = pointsRef.current;
    if (PERFORMANCE.saturnLod && progress >= 0.999 && points) {
      const cam = state.camera as PerspectiveCamera;
      points.updateWorldMatrix(true, false);
      const worldRadius = PLANET.radius * points.matrixWorld.getMaxScaleOnAxis();
      const dist = Math.max(points.getWorldPosition(_center).distanceTo(cam.position), worldRadius * 1.05);
      const focal = state.size.height / 2 / Math.tan((cam.fov * Math.PI) / 360);
      const radiusPx = (worldRadius * focal) / dist;
      const limit = PLANET_LOD.maxDotsPerPx * Math.PI * (radiusPx * state.viewport.dpr) ** 2 * 2;
      drawn = Math.min(count, Math.max(limit, PLANET_LOD.minDots));
    }
    points?.geometry.setDrawRange(0, Math.min(count, Math.ceil(drawn * (1 + PLANET_LOD.fadeBand))));
    m.uniforms.uLodCount.value = drawn;
    m.uniforms.uLodFade.value = PLANET_LOD.fadeBand;
    saturnLod.share = drawn / count;
    // Fly-out: thin the cloud a little as the camera flies away (a proxy for
    // distance), capped so the hero Saturn stays legible and never vanishes.
    // Reverses cleanly on scroll-up.
    m.uniforms.uThin.value = FLYOUT.thinMax * voyage;

    // From the voyage on, the real Sun lights it (a real day and night side), blended
    // in as the system fades in; the About section keeps its own light.
    m.uniforms.uSunLight.value = easeInOutCubic(remap01(voyage, SOLAR.revealStart, SOLAR.revealEnd));
    m.uniforms.uSunAmbient.value = PLANET_STYLE.ambient;
    const [sx, sy, sz] = flyingSunPos();
    const a = useSaturnAnchor.getState();
    m.uniforms.uSunDir.value.set(sx - a.x, sy - a.y, sz - a.z).transformDirection(state.camera.matrixWorldInverse);

    // The solid core grows with the assembling planet (the shader's assembleScale)
    // and only fades in as the last dots land, so no dark ball shows mid-assembly.
    if (coreRef.current && coreMatRef.current) {
      const grow = smoothstep(0, 0.82, progress);
      const wob = smoothstep(0.6, 1, progress);
      const assembleScale =
        GROWTH.startScale + (1 - GROWTH.startScale) * grow + GROWTH.overshoot * Math.sin(Math.PI * wob);
      coreRef.current.scale.setScalar(PLANET.radius * PLANET.coreScale * assembleScale);
      const opacity = smoothstep(0.85, 1, progress) * m.uniforms.uOpacity.value;
      coreMatRef.current.opacity = opacity;
      coreRef.current.visible = opacity > 0.001;
    }
  });

  return (
    <>
      {/* The solid core: drawn before the dots and the rings (renderOrder −0.5) and
        writing depth, so the far side and the back of the rings hide behind it. */}
      <mesh ref={coreRef} renderOrder={-0.5} visible={false}>
        <sphereGeometry args={[1, 48, 32]} />
        <meshBasicMaterial ref={coreMatRef} color={PLANET.coreColor} transparent depthWrite opacity={0} />
      </mesh>
      <points ref={pointsRef} geometry={geometry ?? placeholder}>
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
    </>
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
uniform vec3 uSunDir;
uniform float uSunLight;
uniform float uSunAmbient;
uniform float uRimStart;
uniform float uRimScatter;
uniform float uForm;         // 0 = dispersed in space, 1 = assembled
uniform float uScatterDrift;
uniform float uStagger;
uniform float uStartScale;   // planet scale at the start of construction
uniform float uOvershoot;    // how far past full size it pops before settling
uniform float uCullBack;     // 1 = drop the dots hidden behind the core
uniform float uCoreRadius;
uniform vec3 uCamLocal;      // the camera, in the planet's own space
uniform float uLodCount, uLodFade; // level of detail: dots drawn + the fading share
varying float vLod;
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
  // Level of detail: the dots past uLodCount fade out over the next uLodFade share.
  float index = float(gl_VertexID);
  vLod = clamp((uLodCount * (1.0 + uLodFade) - index) / max(uLodCount * uLodFade, 1.0), 0.0, 1.0);

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

  // Formed, with its core opaque: a dot the core hides from the camera (its sight line
  // crosses the core first) is dropped here, before the rest of its noise and any
  // pixel work (P27-78). The grainy edge (its dots get pushed out below) is kept.
  if (uCullBack > 0.5 && rim < uRimStart) {
    vec3 ray = p - uCamLocal;
    float a = dot(ray, ray);
    float b = 2.0 * dot(uCamLocal, ray);
    float c = dot(uCamLocal, uCamLocal) - uCoreRadius * uCoreRadius;
    float disc = b * b - 4.0 * a * c;
    if (disc > 0.0) {
      float hit = (-b - sqrt(disc)) / (2.0 * a);
      if (hit > 0.0 && hit < 1.0) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // off-screen (clipped)
        gl_PointSize = 0.0;
        return;
      }
    }
  }

  // A sliver of radial breathing keeps the surface alive (halo breathes more).
  float n = snoise(position * 2.2 + vec3(t));
  p += nrm * n * uTurbulence * (1.0 + aHalo * 2.0);

  // …then push surface particles near the rim outward → loose grainy edge.
  float rimMask = smoothstep(uRimStart, 1.0, rim) * (1.0 - aHalo);
  p += nrm * rimMask * aSeed * uRimScatter;

  // Directional lighting (surface keeps lit/shadowed sides; halo stays soft).
  float diff = max(dot(viewNrm, normalize(uLightDir)), 0.0);
  float litAbout = uAmbient + (1.0 - uAmbient) * diff;
  // The real Sun: a soft terminator, like the other planets.
  float sunDiff = smoothstep(-0.12, 0.45, dot(viewNrm, normalize(uSunDir)));
  float litSun = uSunAmbient + (1.0 - uSunAmbient) * sunDiff;
  float litSurface = mix(litAbout, litSun, uSunLight);
  float litHalo = uAmbient + 0.25;
  vBright = mix(litSurface, litHalo, aHalo);

  // Scroll-driven assembly: blend from a dispersed point in space (gently
  // drifting) to the home position above. Per-particle stagger so they don't
  // all snap home at once (low-seed particles arrive first).
  vec3 home = p;
  // Grow the assembling planet from a scaled-down size to full, overshooting a
  // little past full then settling exactly to 1.0 as the last particles land.
  float grow = smoothstep(0.0, 0.82, uForm);
  float wob = smoothstep(0.6, 1.0, uForm);
  float assembleScale = mix(uStartScale, 1.0, grow) + uOvershoot * sin(3.14159265 * wob);
  home *= assembleScale;

  // Assembled (uForm 1, the rest of the page): every dot is home, so its drifting scatter
  // (three noises a dot) would be weighed by exactly 0 — skip it (P27-86).
  if (uForm < 1.0) {
    float ds = uTime * 0.05;
    vec3 scattered = aScatter + vec3(
      snoise(aScatter * 0.5 + vec3(ds, 0.0, 0.0)),
      snoise(aScatter * 0.5 + vec3(0.0, ds + 4.0, 0.0)),
      snoise(aScatter * 0.5 + vec3(0.0, 0.0, ds + 8.0))
    ) * uScatterDrift;
    float f = clamp((uForm - aSeed * uStagger) / (1.0 - uStagger), 0.0, 1.0);
    f = f * f * (3.0 - 2.0 * f);
    p = mix(scattered, home, f);
  } else {
    p = home;
  }

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
uniform float uThin;         // 0 = full cloud, 1 = fully thinned (fly-away)
varying vec3 vColor;
varying float vBright;
varying float vRim;
varying float vSeed;
varying float vHalo;
varying float vLod;

void main(){
  // Fly-away thinning: drop a growing fraction of dots (by per-particle seed) so
  // the cloud reads as fewer and fewer grains as it recedes into deep space.
  if (vSeed < uThin) discard;

  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.12, d);

  // Grainy rim dissolve (surface): higher-seed dots near the edge fade out,
  // so the silhouette breaks into loose grain instead of a hard circle.
  float rimMask = smoothstep(uRimStart, 1.0, vRim);
  float surfaceFade = 1.0 - rimMask * vSeed * 0.85;

  // Halo particles are uniformly faint dust.
  float alpha = a * mix(surfaceFade, uHaloOpacity, vHalo) * uOpacity * vLod;
  if (alpha < 0.003) discard;

  gl_FragColor = vec4(vColor * vBright, alpha);
}
`;
