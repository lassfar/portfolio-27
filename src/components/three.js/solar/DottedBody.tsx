"use client";

import { useFrame } from "@react-three/fiber";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  Mesh,
  NormalBlending,
  PerspectiveCamera,
  ShaderMaterial,
  Sphere,
  Vector3,
  Vector4,
} from "three";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { flyingSunPos } from "#/components/three.js/galaxy/spin";
import { PLANET_LOD, PLANET_STYLE, PlanetLook, SATURN_LOOK, SOLAR_MOBILE_SCALE } from "./config";
import { PLANET_FRAG, PLANET_VERT } from "./planetShaders";
import { planetInspect, usePlanetTuning } from "./planetTuning";

/** What a dotted body needs (a planet or a moon). Mutable: the dev panel tunes it. */
export type BodyShape = {
  id: string;
  size: number; // radius (world)
  count: number; // the most dots it draws, up close (scaled down on mobile)
  look: PlanetLook;
  tilt?: number; // axial tilt (°)
  saturnLook?: boolean; // the Saturn's dots + dust (SATURN_LOOK)
  highlight?: boolean;
};

type Props = {
  body: BodyShape;
  animate: boolean;
  /** Its visibility (0..1), read each frame. */
  reveal: () => number;
  /** Self-spin speed (rad/s), read each frame — or… */
  spinRate?: () => number;
  /** …its spin angle (rad), for a tidally locked moon. */
  spinAngle?: () => number;
  /** Rendered in its equatorial frame (tilted, not spinning) — e.g. its moons. */
  children?: ReactNode;
};

const DEG = Math.PI / 180;
const _center = new Vector3();

/**
 * One dotted planet or moon in the Saturn's dot style — fine dots scattered at random
 * with a little radial grain, varied in size and brightness, twinkling, with a grainy
 * dissolving edge — drawn with its real features (`look`: belts, storms, dark regions,
 * polar caps, cloud streaks — see planetShaders.ts) and lit by the actual Sun, so its
 * day side faces it. A dark core under the dots keeps it solid (nothing shows through
 * from behind). It sits on its axial tilt and spins on it. The parent places it.
 *
 * Level of detail (PLANET_LOD): each frame it measures its radius on screen and draws
 * as many dots as the Saturn would at that size — few, slightly bigger ones when far,
 * many fine ones up close (up to `count`). The dots aren't stored: the shader builds
 * each from its number, so the geometry is one byte per dot and drawing fewer is free.
 * Every value is live-tunable from the dev panel (PlanetGui).
 */
const DottedBody = ({ body, animate, reveal, spinRate, spinAngle, children }: Props) => {
  const bodyRef = useRef<Group>(null);
  const tiltRef = useRef<Group>(null); // the axial tilt
  const spinRef = useRef<Group>(null); // self-rotation
  const coreRef = useRef<Mesh>(null); // the solid dark core under the dots

  const version = usePlanetTuning((s) => s.version); // bumped by the panel's shape values
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;

  const geometry = useMemo(() => {
    const count = isSmall ? Math.round(body.count * SOLAR_MOBILE_SCALE) : body.count;
    const g = new BufferGeometry();
    // One byte per dot: the shader builds each dot from its number (gl_VertexID);
    // three only needs the count. (Its bounds are set, so they're never computed.)
    g.setAttribute("position", new BufferAttribute(new Uint8Array(count), 1));
    g.boundingSphere = new Sphere(new Vector3(), body.size * 1.2);
    g.userData.count = count;
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` rebuilds from the tuned body
  }, [isSmall, version]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const material = useMemo(() => {
    const L = body.look;
    return new ShaderMaterial({
      transparent: true,
      depthWrite: false, // the back hemisphere is culled in the shader instead
      blending: NormalBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 1 },
        uPixelRatio: { value: 1 },
        uSoftness: { value: PLANET_STYLE.dotSoftness },
        uRadius: { value: body.size },
        uJitter: { value: PLANET_STYLE.shellJitter },
        uLodCount: { value: 0 },
        uLodFade: { value: PLANET_LOD.fadeBand },
        uRimStart: { value: PLANET_STYLE.rimStart },
        uRimScatter: { value: PLANET_STYLE.rimScatter },
        uRimAmount: { value: 1 },
        uDust: { value: 0 },
        uDustReach: { value: SATURN_LOOK.dustReach },
        uDustOpacity: { value: SATURN_LOOK.dustOpacity },
        uDustBreath: { value: SATURN_LOOK.dustBreath },
        uGradient: { value: L.gradient ? 1 : 0 },
        uDeep: { value: new Color(L.deep) },
        uAmbient: { value: PLANET_STYLE.ambient },
        uSunPos: { value: new Vector3() },
        uReveal: { value: 0 },
        uThin: { value: 0 },
        uBoost: { value: body.highlight ? 1.18 : 1.0 },
        uBase: { value: new Color(L.base) },
        uDark: { value: new Color(L.dark) },
        uLight: { value: new Color(L.light) },
        uAccent: { value: new Color(L.accent) },
        uSpotColor: { value: new Color(L.spot.color) },
        uBands: { value: L.bands },
        uBandContrast: { value: L.bandContrast },
        uBandWarp: { value: L.bandWarp },
        uFlow: { value: L.flow },
        uMottle: { value: L.mottle },
        uMottleScale: { value: L.mottleScale },
        uAccentPatches: { value: L.accentPatches },
        uCaps: { value: L.caps },
        uClouds: { value: L.clouds },
        uHaze: { value: L.haze },
        uSpot: { value: new Vector4() },
        uSpotAspect: { value: L.spot.aspect },
      },
      vertexShader: PLANET_VERT,
      fragmentShader: PLANET_FRAG,
    });
  }, [body]);
  useEffect(() => () => material.dispose(), [material]);

  // The core: the body's main colour, lit by the Sun like the dots (see CORE_VERT/FRAG).
  const coreMaterial = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: true,
        uniforms: {
          uColor: { value: new Color(body.look.base) },
          uCoreColor: { value: new Color(PLANET_STYLE.coreColor) },
          uTint: { value: PLANET_STYLE.coreTint },
          uSunPos: { value: new Vector3() },
          uAmbient: { value: PLANET_STYLE.ambient },
          uShade: { value: PLANET_STYLE.coreShade },
          uOpacity: { value: 0 },
        },
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
      }),
    [body]
  );
  useEffect(() => () => coreMaterial.dispose(), [coreMaterial]);

  useFrame((state, delta) => {
    const u = material.uniforms;
    if (animate) u.uTime.value += delta;
    if (spinRef.current) {
      if (spinAngle) spinRef.current.rotation.y = spinAngle();
      else if (animate && spinRate) spinRef.current.rotation.y += delta * spinRate();
    }
    if (tiltRef.current) tiltRef.current.rotation.z = (body.tilt ?? 0) * DEG;

    // The light: the Sun's live position (it flies with the system at the finale).
    const [sx, sy, sz] = flyingSunPos();
    u.uSunPos.value.set(sx, sy, sz);
    // For the dev panel's inspect camera.
    if (bodyRef.current) planetInspect.bodies[body.id] = { object: bodyRef.current, size: body.size };

    // Level of detail: its radius on screen (CSS px) → how many dots, and how big.
    const cam = state.camera as PerspectiveCamera;
    const dist = Math.max(
      bodyRef.current ? bodyRef.current.getWorldPosition(_center).distanceTo(cam.position) : 1,
      body.size * 1.05
    );
    const focal = state.size.height / 2 / Math.tan((cam.fov * DEG) / 2);
    const radiusPx = (body.size * focal) / dist;
    const lod = PLANET_LOD;
    // The big planets take the Saturn's own dots + dust; the rest the shared style.
    const saturn = body.saturnLook ? SATURN_LOOK : null;
    const dust = saturn ? saturn.dust : 0;
    // Real-size dots, held at minDotPx when far, capped relative to the body when it's
    // small; then just enough of them to cover its disc.
    const realPx = (saturn ? saturn.dotWorld : lod.dotWorld) / dist;
    let dotPx = Math.max(lod.minDotPx, Math.min(realPx, lod.maxDotRel * 2 * radiusPx));
    // Held bigger than real (far): pack closer, so the small disc reads solid. And any
    // body whose dots sit at the 1 px minimum (tiny bodies, capped) packs fully too —
    // 1 px dots at the Saturn's up-close coverage would leave the core showing through.
    const coverage =
      dotPx <= lod.minDotPx
        ? lod.farCoverage
        : Math.min(lod.coverage * Math.pow(Math.max(dotPx / realPx, 1), lod.farPack), lod.farCoverage);
    const wanted = (8 * coverage * (radiusPx / dotPx) ** 2) / (1 - Math.min(dust, 0.9)); // both halves (+ the dust)
    const budget = geometry.userData.count as number;
    const dots = Math.min(Math.max(wanted, lod.minDots), budget);
    // Past its budget (very close), the dots grow so the surface stays covered.
    if (wanted > dots) dotPx *= Math.sqrt(wanted / dots);
    geometry.setDrawRange(0, Math.min(budget, Math.ceil(dots * (1 + lod.fadeBand))));
    u.uLodCount.value = dots;
    u.uLodFade.value = lod.fadeBand;
    u.uSize.value = dotPx * dist * (body.highlight ? 11 / 9 : 1);

    // Live values (the dev panel tunes PLANET_STYLE + the look in place).
    const L = body.look;
    u.uPixelRatio.value = state.viewport.dpr;
    u.uSoftness.value = saturn ? saturn.dotSoftness : PLANET_STYLE.dotSoftness;
    u.uRadius.value = body.size;
    u.uJitter.value = saturn ? saturn.shellJitter : PLANET_STYLE.shellJitter;
    u.uRimStart.value = saturn ? saturn.rimStart : PLANET_STYLE.rimStart;
    u.uRimScatter.value = saturn ? saturn.rimScatter : PLANET_STYLE.rimScatter;
    u.uDust.value = dust;
    u.uDustReach.value = SATURN_LOOK.dustReach;
    u.uDustOpacity.value = SATURN_LOOK.dustOpacity;
    u.uDustBreath.value = SATURN_LOOK.dustBreath;
    // The grainy edge fades out on small discs, so far bodies keep a clean round outline.
    const edge = Math.min(Math.max((radiusPx - 15) / 45, 0), 1);
    u.uRimAmount.value = edge * edge * (3 - 2 * edge);
    u.uGradient.value = L.gradient ? 1 : 0;
    u.uDeep.value.set(L.deep);
    u.uAmbient.value = PLANET_STYLE.ambient;
    u.uBase.value.set(L.base);
    u.uDark.value.set(L.dark);
    u.uLight.value.set(L.light);
    u.uAccent.value.set(L.accent);
    u.uSpotColor.value.set(L.spot.color);
    u.uBands.value = L.bands;
    u.uBandContrast.value = L.bandContrast;
    u.uBandWarp.value = L.bandWarp;
    u.uFlow.value = L.flow;
    u.uMottle.value = L.mottle;
    u.uMottleScale.value = L.mottleScale;
    u.uAccentPatches.value = L.accentPatches;
    u.uCaps.value = L.caps;
    u.uClouds.value = L.clouds;
    u.uHaze.value = L.haze;
    u.uSpot.value.set(L.spot.lat * DEG, L.spot.lon * DEG, L.spot.size * DEG, L.spot.strength);
    u.uSpotAspect.value = L.spot.aspect;

    u.uReveal.value = reveal();
    // Optional dot-thinning as the camera pulls away (off by default).
    u.uThin.value = PLANET_STYLE.thin * useVoyageScroll.getState().progress;
    // The core sits just under the lowest dots and fades with them.
    if (coreRef.current) {
      coreRef.current.visible = PLANET_STYLE.core && u.uReveal.value > 0.001;
      coreRef.current.scale.setScalar(body.size * (1 - (saturn ? saturn.shellJitter : PLANET_STYLE.shellJitter) / 2) * 0.98);
      const c = coreMaterial.uniforms;
      c.uOpacity.value = u.uReveal.value;
      c.uColor.value.set(L.base);
      c.uCoreColor.value.set(PLANET_STYLE.coreColor);
      c.uTint.value = PLANET_STYLE.coreTint;
      c.uSunPos.value.copy(u.uSunPos.value);
      c.uAmbient.value = PLANET_STYLE.ambient;
      c.uShade.value = PLANET_STYLE.coreShade;
    }
  });

  return (
    <group ref={bodyRef}>
      {/* Drawn after the Sun (renderOrder −4…−1) and before the dots (0), writing depth,
        so it hides what's behind the body but never its own front dots. */}
      <mesh ref={coreRef} material={coreMaterial} renderOrder={-0.5} visible={false}>
        <sphereGeometry args={[1, 32, 16]} />
      </mesh>
      <group ref={tiltRef}>
        <group ref={spinRef}>
          <points geometry={geometry} material={material} frustumCulled={false} />
        </group>
        {children}
      </group>
    </group>
  );
};

export default DottedBody;

/** The core's surface: the body's main colour (or coreColor) under the same Sun light as its dots. */
const CORE_VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vWorld;
void main(){
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const CORE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor, uCoreColor, uSunPos;
uniform float uTint, uAmbient, uShade, uOpacity;
varying vec3 vNormal;
varying vec3 vWorld;
void main(){
  float ndl = dot(normalize(vNormal), normalize(uSunPos - vWorld));
  float light = uAmbient + (1.0 - uAmbient) * smoothstep(-0.12, 0.45, ndl);
  // × 0.62: the dots' brightness scale (held under the bloom threshold).
  gl_FragColor = vec4(mix(uCoreColor, uColor, uTint) * light * uShade * 0.62, uOpacity);
}
`;
