"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LinearSRGBColorSpace,
  MathUtils,
  PerspectiveCamera,
  Points,
  ShaderMaterial,
  Vector3,
} from "three";
import { clamp01, remap01 } from "#/components/three.js/star/utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { GALAXY_SPACE } from "./config";
import { mulberry32, SKY_RADIUS } from "./sky";
import { FAR_GALAXY_FRAG, FAR_GALAXY_VERT } from "./shaders";

// Raw screen colours: blue-white, cream, soft peach, baby blue.
const TINTS = ["#c5e0ff", "#ffe3c7", "#ffc896", "#9cc8ff"];

type FarGalaxy = {
  /** Where it sits in the END view: x, y in units of the half-height (±1 = top/bottom edge). */
  at: [number, number];
  px: number; // on-screen size
  axis: number; // 1 = seen face-on (round), small = edge-on (thin)
  angle: number; // tilt on screen (rad)
  spiral: boolean;
  tint: number; // index into TINTS
  bright: number;
};

/**
 * Hand-placed in the empty corners of the full-galaxy view (1280×812 reference),
 * clear of the spiral and the sparkles. The two near the top centre stay in frame on
 * a phone too.
 */
const PLACED: FarGalaxy[] = [
  { at: [-1.05, 0.77], px: 26, axis: 0.42, angle: 0.5, spiral: true, tint: 0, bright: 0.8 },
  { at: [0.91, 0.83], px: 17, axis: 0.78, angle: -0.3, spiral: true, tint: 1, bright: 0.7 },
  { at: [1.42, 0.19], px: 15, axis: 0.22, angle: 0.9, spiral: true, tint: 0, bright: 0.75 },
  { at: [-1.01, -0.45], px: 21, axis: 0.55, angle: -0.7, spiral: true, tint: 2, bright: 0.7 },
  { at: [1.33, -0.28], px: 10, axis: 0.75, angle: 0.3, spiral: false, tint: 2, bright: 0.6 },
  { at: [-0.42, 0.9], px: 9, axis: 0.7, angle: 0.4, spiral: false, tint: 1, bright: 0.6 },
  { at: [0.3, 0.64], px: 8, axis: 0.5, angle: -1.0, spiral: true, tint: 3, bright: 0.6 },
  { at: [-1.43, 0.02], px: 8, axis: 0.6, angle: 1.2, spiral: false, tint: 1, bright: 0.55 },
  { at: [1.45, -0.87], px: 7, axis: 0.8, angle: 0.0, spiral: true, tint: 3, bright: 0.55 },
];

/** More of them scattered over the rest of the sky — found when you drag. */
const SCATTERED = 28;

/**
 * A few tiny, faint galaxies far away in the background — the universe beyond ours,
 * so the spiral reads as ONE galaxy among many. Each is a small smudge: a tilted
 * elliptical glow with a bright core, some with a hint of spiral arms. Laid out in
 * the END view (see `sky.ts`), in the sky frame; they appear as the whole spiral
 * frames up (`GALAXY_SPACE.galaxiesIn`).
 */
const DistantGalaxies = () => {
  const ref = useRef<Points>(null);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const dpr = useThree((s) => s.viewport.dpr);

  const builtFov = useRef(-1);
  const buildGeometry = () => {
    const rnd = mulberry32(53);
    const tanH = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const tints = TINTS.map((hex) => new Color().setStyle(hex, LinearSRGBColorSpace));
    // Each galaxy's direction in the END view's camera space (-z = straight ahead).
    const list: { g: Omit<FarGalaxy, "at">; dir: Vector3 }[] = PLACED.map((g) => ({
      g,
      dir: new Vector3(g.at[0] * tanH, g.at[1] * tanH, -1).normalize(),
    }));
    while (list.length < PLACED.length + SCATTERED) {
      // a random direction OUTSIDE the end view (the ones in it are placed by hand)
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const dir = new Vector3(s * Math.cos(th), u, s * Math.sin(th));
      const inView =
        dir.z < 0 && Math.abs(dir.x / -dir.z) < tanH * 1.8 && Math.abs(dir.y / -dir.z) < tanH * 1.1;
      if (inView) continue;
      list.push({
        dir,
        g: {
          px: 6 + Math.pow(rnd(), 2) * 20,
          axis: 0.2 + rnd() * 0.8,
          angle: rnd() * Math.PI,
          spiral: rnd() < 0.6,
          tint: Math.floor(rnd() * TINTS.length),
          bright: 0.5 + rnd() * 0.3,
        },
      });
    }
    const n = list.length;
    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const px = new Float32Array(n);
    const axis = new Float32Array(n);
    const angle = new Float32Array(n);
    const type = new Float32Array(n);
    const bright = new Float32Array(n);
    const seed = new Float32Array(n);
    list.forEach(({ g, dir }, i) => {
      pos[i * 3] = dir.x * SKY_RADIUS * 0.99;
      pos[i * 3 + 1] = dir.y * SKY_RADIUS * 0.99;
      pos[i * 3 + 2] = dir.z * SKY_RADIUS * 0.99;
      col[i * 3] = tints[g.tint].r;
      col[i * 3 + 1] = tints[g.tint].g;
      col[i * 3 + 2] = tints[g.tint].b;
      px[i] = g.px;
      axis[i] = g.axis;
      angle[i] = g.angle;
      type[i] = g.spiral ? 1 : 0;
      bright[i] = g.bright;
      seed[i] = rnd();
    });
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new Float32BufferAttribute(col, 3));
    geo.setAttribute("aPx", new Float32BufferAttribute(px, 1));
    geo.setAttribute("aAxis", new Float32BufferAttribute(axis, 1));
    geo.setAttribute("aAngle", new Float32BufferAttribute(angle, 1));
    geo.setAttribute("aType", new Float32BufferAttribute(type, 1));
    geo.setAttribute("aBright", new Float32BufferAttribute(bright, 1));
    geo.setAttribute("aSeed", new Float32BufferAttribute(seed, 1));
    return geo;
  };
  useEffect(() => () => ref.current?.geometry.dispose(), []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
        uniforms: {
          uPixelRatio: { value: 1 },
          uSize: { value: GALAXY_SPACE.galaxySize },
          uBright: { value: GALAXY_SPACE.galaxyBrightness },
          uFade: { value: 0 },
        },
        vertexShader: FAR_GALAXY_VERT,
        fragmentShader: FAR_GALAXY_FRAG,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const points = ref.current;
    if (!points) return;
    if (builtFov.current !== camera.fov) {
      const old = points.geometry;
      points.geometry = buildGeometry();
      old.dispose();
      builtFov.current = camera.fov;
    }
    const g = clamp01(useGalaxyScroll.getState().progress);
    const fade = GALAXY_SPACE.showGalaxies
      ? remap01(g, GALAXY_SPACE.galaxiesIn[0], GALAXY_SPACE.galaxiesIn[1])
      : 0;
    points.visible = fade > 0.001;
    material.uniforms.uFade.value = fade;
    material.uniforms.uSize.value = GALAXY_SPACE.galaxySize; // live-tunable (GalaxyGui)
    material.uniforms.uBright.value = GALAXY_SPACE.galaxyBrightness;
    material.uniforms.uPixelRatio.value = dpr;
  });

  return (
    <points
      ref={ref}
      material={material}
      renderOrder={-2}
      frustumCulled={false}
      visible={false}
    />
  );
};

export default DistantGalaxies;
