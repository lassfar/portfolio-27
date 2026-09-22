"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, CanvasTexture, Sprite, SpriteMaterial } from "three";
import { clamp01, remap01 } from "#/components/three.js/star/utils";
import { useLabScroll } from "#/stores/useLabScroll";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { PALE_BLUE_DOT as PBD } from "./config";

/** Soft round blue glow for the dot. */
function makeGlow(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(214,232,255,0.95)"); // pale blue-white core
    g.addColorStop(0.4, color); // blue body
    g.addColorStop(1, "rgba(80,140,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(c);
}

/**
 * The Pale Blue Dot — Earth as a single lonely blue speck lingering far behind
 * Voyager, echoing the photo Voyager 1 took of Earth from ~6 billion km. Fades in
 * (LAB → PALE_BLUE_DOT.fade) as the craft settles into the near view.
 */
const PaleBlueDot = () => {
  const ref = useRef<Sprite>(null);
  const tex = useMemo(() => makeGlow("rgba(120,170,255,0.6)"), []);
  const mat = useMemo(
    () =>
      new SpriteMaterial({
        map: tex,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [tex]
  );

  useFrame(() => {
    const lab = clamp01(useLabScroll.getState().progress);
    // Fade in with the Lab, then back out as the galaxy finale pulls away.
    const galaxyFade = remap01(useGalaxyScroll.getState().progress, 0, 0.12);
    const op = remap01(lab, PBD.fade[0], PBD.fade[1]) * (1 - galaxyFade);
    if (ref.current) {
      ref.current.visible = op > 0.001;
      mat.opacity = op;
    }
  });

  return (
    <sprite
      ref={ref}
      position={PBD.pos}
      scale={[PBD.size, PBD.size, PBD.size]}
      material={mat}
      visible={false}
    />
  );
};

export default PaleBlueDot;
