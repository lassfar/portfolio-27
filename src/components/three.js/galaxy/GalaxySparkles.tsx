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
} from "three";
import { clamp01, remap01 } from "#/components/three.js/star/utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { GALAXY_FX } from "./config";
import { mulberry32 } from "./sky";
import { SPARKLE_FRAG, SPARKLE_VERT } from "./shaders";

const SP = GALAXY_FX.sparkles;
const TINTS = [0xffffff, 0xfff1dc, 0xcfe0ff, 0xffe3c7];
const DEPTH = 14; // distance in the sky frame (any value works — their size is in px)
// Around the rest of the sky (found when you drag), at the same density as in view.
const AROUND_PER_VIEW = 11;

/**
 * Sparkly foreground stars for the galaxy finale: a few bright stars with a small
 * cross-shaped sparkle, like stars in a telescope photo. Laid out in the END view's
 * camera space — the same seeded layout as the prototype, spread across the frame for
 * this aspect — plus more all around the sky, so a drag turns up new ones. They live
 * in the sky frame (see `sky.ts`): pinned to the camera (never lagging behind it),
 * turning with the galaxy on a drag, and fading in with the full galaxy view
 * (`GALAXY_FX.sparkles.fadeIn`). Rendered inside the galaxy's display-space layer
 * (see `Galaxy.tsx`), like the prototype.
 */
const GalaxySparkles = ({ animate = true }: { animate?: boolean }) => {
  const ref = useRef<Points>(null);
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);

  // Same seeded layout as the prototype, spread across the frame for this aspect.
  // Built imperatively (and rebuilt when the count is tuned or the viewport changes).
  const builtKey = useRef("");
  const buildGeometry = () => {
    const rnd = mulberry32(7);
    const tanH = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const aspect = width / Math.max(1, height);
    const c = new Color();
    const pos: number[] = [];
    const col: number[] = [];
    const scl: number[] = [];
    const sed: number[] = [];
    for (let i = 0; i < SP.count; i++) {
      const nx = (rnd() * 2 - 1) * 0.92;
      const ny = (rnd() * 2 - 1) * 0.85;
      pos.push(nx * tanH * aspect * DEPTH, ny * tanH * DEPTH, -DEPTH);
      c.setHex(TINTS[Math.floor(rnd() * TINTS.length)], LinearSRGBColorSpace); // raw screen values
      col.push(c.r, c.g, c.b);
      scl.push(0.45 + Math.pow(rnd(), 2) * 0.9);
      sed.push(rnd());
    }
    // …and all around the rest of the sky (outside the end view).
    const around = mulberry32(11);
    for (let i = 0, n = SP.count * AROUND_PER_VIEW; i < n; ) {
      const u = around() * 2 - 1;
      const th = around() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const x = s * Math.cos(th);
      const z = s * Math.sin(th);
      if (z < 0 && Math.abs(x / -z) < tanH * aspect && Math.abs(u / -z) < tanH) continue;
      pos.push(x * DEPTH, u * DEPTH, z * DEPTH);
      c.setHex(TINTS[Math.floor(around() * TINTS.length)], LinearSRGBColorSpace);
      col.push(c.r, c.g, c.b);
      scl.push(0.45 + Math.pow(around(), 2) * 0.9);
      sed.push(around());
      i++;
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("aColor", new Float32BufferAttribute(col, 3));
    g.setAttribute("aScale", new Float32BufferAttribute(scl, 1));
    g.setAttribute("aSeed", new Float32BufferAttribute(sed, 1));
    return g;
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
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uFade: { value: 0 },
          uSparkSize: { value: SP.size },
          uSpikes: { value: SP.spikes },
        },
        vertexShader: SPARKLE_VERT,
        fragmentShader: SPARKLE_FRAG,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame((_, delta) => {
    const points = ref.current;
    if (!points) return;
    const key = `${SP.count}|${width}|${height}|${camera.fov}`;
    if (builtKey.current !== key) {
      const old = points.geometry;
      points.geometry = buildGeometry();
      old.dispose();
      builtKey.current = key;
    }
    const g = clamp01(useGalaxyScroll.getState().progress);
    const fade = GALAXY_FX.showSparkles ? remap01(g, SP.fadeIn[0], SP.fadeIn[1]) : 0;
    points.visible = fade > 0.001;
    material.uniforms.uFade.value = fade;
    material.uniforms.uSparkSize.value = SP.size; // live-tunable (GalaxyGui)
    material.uniforms.uSpikes.value = SP.spikes;
    material.uniforms.uPixelRatio.value = dpr;
    if (animate) material.uniforms.uTime.value += delta;
  });

  return (
    <points
      ref={ref}
      material={material}
      renderOrder={10}
      frustumCulled={false}
      visible={false}
    />
  );
};

export default GalaxySparkles;
