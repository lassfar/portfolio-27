"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  NormalBlending,
  ShaderMaterial,
} from "three";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { SOLAR, SUN, SUN_CORE, VOYAGE } from "./config";
import { finaleReturn } from "./reveal";
import { DOT_FRAG, DOT_VERT } from "./sunShaders";
import SunCore from "./SunCore";
import { useSunTuning } from "./tuning";

type Props = {
  animate?: boolean;
};

/**
 * Dots scattered at random over the unit sphere (like the Saturn's), each with a little
 * radial grain — an organic, grainy surface, never a regular pattern.
 */
function scatteredSphere(n: number): Float32Array {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 1 + (Math.random() - 0.5) * SUN.shellJitter;
    out[i * 3] = s * Math.cos(theta) * r;
    out[i * 3 + 1] = u * r;
    out[i * 3 + 2] = s * Math.sin(theta) * r;
  }
  return out;
}

/**
 * The Sun — a see-through ball of tightly packed dots, coloured like the original Sun,
 * with the original Sun's glowing core, corona and halo inside and around it:
 *
 *   • the dots follow the Saturn / Earth dot style — scattered at random with a little
 *     radial grain, varied in size and brightness, soft and round, shrinking with
 *     distance — packed tight; they shimmer gently and drift slowly along the surface
 *     (keeping their radius) while the Sun turns;
 *   • the original Sun's colours + gradient across the disc (warm white at the centre →
 *     orange → deep red-orange at the edge), so it reads round;
 *   • see-through: the far side shows dimmer through the gaps, behind the glowing core
 *     (SunCore — a 3D volume of warm dots); the same shell dots are drawn twice: far
 *     side, then the core, then the near side.
 *
 * Fades in with the system, out for the Earth dive, back in for the galaxy finale.
 * Every value is live-tunable from the dev panel (SunGui); shape values rebuild the dots.
 */
const Sun = ({ animate = true }: Props) => {
  const dpr = useThree((s) => s.viewport.dpr);
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const version = useSunTuning((s) => s.version); // bumped by the panel's shape values

  const geometry = useMemo(() => {
    const count = isSmall ? SUN.countMobile : SUN.count;
    const g = new BufferGeometry();
    g.setAttribute("position", new Float32BufferAttribute(scatteredSphere(count), 3));
    const scale = new Float32Array(count);
    const bright = new Float32Array(count);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      scale[i] = 0.6 + Math.random() * 0.8; // varied sizes, like the Saturn's dots
      bright[i] = 0.82 + Math.random() * 0.32; // varied brightness
      seed[i] = Math.random();
    }
    g.setAttribute("aScale", new Float32BufferAttribute(scale, 1));
    g.setAttribute("aBright", new Float32BufferAttribute(bright, 1));
    g.setAttribute("aSeed", new Float32BufferAttribute(seed, 1));
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `version` rebuilds from the tuned SUN
  }, [isSmall, version]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const shared = useMemo(
    () => ({
      uTime: { value: 0 },
      uRadius: { value: SUN.radius },
      uReveal: { value: 0 },
    }),
    []
  );

  const materials = useMemo(() => {
    const c = (hex: string) => new Color(hex);
    const dots = (side: 1 | -1) =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: NormalBlending,
        uniforms: {
          ...shared,
          uSpin: { value: SUN.spin },
          uSwirl: { value: SUN.swirl },
          uSize: { value: SUN.dotSize },
          uPixelRatio: { value: 1 },
          uShimmer: { value: SUN.shimmer },
          uShimmerSpeed: { value: SUN.shimmerSpeed },
          uBackDim: { value: SUN.backDim },
          uSide: { value: side },
          uCore: { value: c(SUN.core) },
          uMid: { value: c(SUN.mid) },
          uEdge: { value: c(SUN.edge) },
          uSplit: { value: SUN.gradientSplit },
          uBrightness: { value: SUN.brightness },
          uSoftness: { value: SUN.dotSoftness },
        },
        vertexShader: DOT_VERT,
        fragmentShader: DOT_FRAG,
      });
    return { far: dots(-1), near: dots(1) };
  }, [shared]);
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);

  useFrame((_, delta) => {
    if (animate && !SUN.paused) shared.uTime.value += delta;
    shared.uRadius.value = SUN.radius;
    // Live values (the dev panel tunes SUN in place).
    for (const m of [materials.far, materials.near]) {
      const u = m.uniforms;
      u.uPixelRatio.value = dpr;
      u.uSpin.value = SUN.spin;
      u.uSwirl.value = SUN.swirl;
      u.uSize.value = SUN.dotSize;
      u.uShimmer.value = SUN.shimmer;
      u.uShimmerSpeed.value = SUN.shimmerSpeed;
      u.uBackDim.value = SUN.backDim;
      u.uSplit.value = SUN.gradientSplit;
      u.uBrightness.value = SUN.brightness;
      u.uSoftness.value = SUN.dotSoftness;
      u.uCore.value.set(SUN.core);
      u.uMid.value.set(SUN.mid);
      u.uEdge.value.set(SUN.edge);
    }
    const voyage = useVoyageScroll.getState().progress;
    // Fade in with the system, then fade OUT as we dive to Earth — then fade BACK in
    // for the galaxy finale (the pull-out re-reveals the whole real system).
    const earthFade = remap01(voyage, VOYAGE.earthFadeStart, VOYAGE.earthFadeEnd);
    shared.uReveal.value =
      easeOutCubic(remap01(voyage, SOLAR.revealStart, SOLAR.revealEnd)) *
      (1 - earthFade * (1 - finaleReturn()));
  });

  // Far side → the old Sun's halo, glowing core + drifting corona → near side.
  return (
    <group>
      <points geometry={geometry} material={materials.far} renderOrder={-4} frustumCulled={false} />
      <SunCore
        count={isSmall ? SUN_CORE.countMobile : SUN_CORE.count}
        version={version}
        animate={animate}
        time={shared.uTime}
        reveal={shared.uReveal}
        renderOrder={-2}
      />
      <points geometry={geometry} material={materials.near} renderOrder={-1} frustumCulled={false} />
    </group>
  );
};

export default Sun;
