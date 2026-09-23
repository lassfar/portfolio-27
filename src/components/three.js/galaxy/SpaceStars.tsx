"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  LinearSRGBColorSpace,
  Points,
  ShaderMaterial,
} from "three";
import { clamp01, remap01 } from "#/components/three.js/star/utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { GALAXY_SPACE } from "./config";
import { mulberry32, SKY_RADIUS } from "./sky";
import { galaxyTuning } from "./tuning";
import { SPACE_STAR_FRAG, SPACE_STAR_VERT } from "./shaders";

// Real stellar tints (blue-white → white → warm), with a touch of the brand peach.
const TINTS = ["#ffffff", "#eaf1ff", "#cfe0ff", "#c5e0ff", "#fff4e6", "#ffe3c7", "#ffc896"];
const TINT_WEIGHTS = [0.24, 0.2, 0.16, 0.12, 0.12, 0.1, 0.06];

/**
 * The deep field: thousands of tiny, faint, far-away stars all around the galaxy —
 * so it sits IN a starry universe instead of on a black backdrop. Spread evenly over
 * the whole sky (so a drag always turns up more), in the galaxy's own dot language:
 * a fixed ~1px size, mostly very faint, a few brighter. Drawn in the sky frame (see
 * `Galaxy.tsx`) under the galaxy's dust, which darkens the stars behind the lanes.
 */
const SpaceStars = () => {
  const ref = useRef<Points>(null);
  const dpr = useThree((s) => s.viewport.dpr);
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;

  const builtVersion = useRef(-1);
  const buildGeometry = () => {
    const rnd = mulberry32(31);
    const count = isSmall ? GALAXY_SPACE.starCountMobile : GALAXY_SPACE.starCount;
    const tints = TINTS.map((hex) => new Color().setStyle(hex, LinearSRGBColorSpace)); // raw screen values
    const total = TINT_WEIGHTS.reduce((a, b) => a + b, 0);
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    const bri = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const u = rnd() * 2 - 1;
      const th = rnd() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pos[i * 3] = s * Math.cos(th) * SKY_RADIUS;
      pos[i * 3 + 1] = u * SKY_RADIUS;
      pos[i * 3 + 2] = s * Math.sin(th) * SKY_RADIUS;
      let pick = rnd() * total;
      let k = 0;
      while (k < TINTS.length - 1 && (pick -= TINT_WEIGHTS[k]) > 0) k++;
      col[i * 3] = tints[k].r;
      col[i * 3 + 1] = tints[k].g;
      col[i * 3 + 2] = tints[k].b;
      const standout = rnd() < 0.04;
      scl[i] = standout ? 1.5 + rnd() * 0.6 : 0.8 + rnd() * 0.45;
      bri[i] = standout ? 0.6 + rnd() * 0.4 : 0.18 + 0.5 * Math.pow(rnd(), 1.6);
    }
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(pos, 3));
    g.setAttribute("aColor", new Float32BufferAttribute(col, 3));
    g.setAttribute("aScale", new Float32BufferAttribute(scl, 1));
    g.setAttribute("aBright", new Float32BufferAttribute(bri, 1));
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
          uPixelRatio: { value: 1 },
          uSize: { value: GALAXY_SPACE.starSize },
          uBright: { value: GALAXY_SPACE.starBrightness },
          uFade: { value: 0 },
        },
        vertexShader: SPACE_STAR_VERT,
        fragmentShader: SPACE_STAR_FRAG,
      }),
    []
  );
  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    const points = ref.current;
    if (!points) return;
    if (builtVersion.current !== galaxyTuning.shapeVersion) {
      const old = points.geometry;
      points.geometry = buildGeometry();
      old.dispose();
      builtVersion.current = galaxyTuning.shapeVersion;
    }
    const g = clamp01(useGalaxyScroll.getState().progress);
    const fade = GALAXY_SPACE.showStars
      ? remap01(g, GALAXY_SPACE.starsIn[0], GALAXY_SPACE.starsIn[1])
      : 0;
    points.visible = fade > 0.001;
    material.uniforms.uFade.value = fade;
    material.uniforms.uSize.value = GALAXY_SPACE.starSize; // live-tunable (GalaxyGui)
    material.uniforms.uBright.value = GALAXY_SPACE.starBrightness;
    material.uniforms.uPixelRatio.value = dpr;
  });

  return (
    <points
      ref={ref}
      material={material}
      renderOrder={-3}
      frustumCulled={false}
      visible={false}
    />
  );
};

export default SpaceStars;
