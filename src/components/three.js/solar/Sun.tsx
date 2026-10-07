"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  NormalBlending,
  Points,
  ShaderMaterial,
} from "three";
import { useDrawGate } from "#/components/three.js/scene/useDrawGate";
import { sceneBuilds } from "#/components/three.js/scene/sceneBuilds";
import { useVoyageScroll } from "#/stores/useVoyageScroll";
import { easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { SOLAR, SUN, SUN_CORE, SYSTEM_SHOWS_AT, VOYAGE } from "./config";
import { sunReturn } from "./reveal";
import { DOT_FRAG, DOT_VERT } from "./sunShaders";
import SunCore from "./SunCore";
import { useSunTuning } from "./tuning";
import { setHexIfChanged } from "#/components/three.js/scene/colorCache";

type Props = {
  animate?: boolean;
};

/** Dots built per step of the build queue (~a fraction of a ms each). */
const BUILD_STEP = 2000;

/** The shell's dots, as flat arrays (one entry per dot, ×3 for positions). */
type ShellDots = {
  positions: Float32Array;
  scales: Float32Array;
  brights: Float32Array;
  seeds: Float32Array;
};

const allocateShell = (count: number): ShellDots => ({
  positions: new Float32Array(count * 3),
  scales: new Float32Array(count),
  brights: new Float32Array(count),
  seeds: new Float32Array(count),
});

/**
 * Dots scattered at random over the unit sphere (like the Saturn's), each with a little
 * radial grain — an organic, grainy surface, never a regular pattern — built into `out`,
 * pausing every BUILD_STEP dots (see sceneBuilds).
 */
function* buildShell(count: number, out: ShellDots) {
  const { positions, scales, brights, seeds } = out;
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const r = 1 + (Math.random() - 0.5) * SUN.shellJitter;
    positions[i * 3] = s * Math.cos(theta) * r;
    positions[i * 3 + 1] = u * r;
    positions[i * 3 + 2] = s * Math.sin(theta) * r;
    scales[i] = 0.6 + Math.random() * 0.8; // varied sizes, like the Saturn's dots
    brights[i] = 0.82 + Math.random() * 0.32; // varied brightness
    seeds[i] = Math.random();
    if ((i + 1) % BUILD_STEP === 0) yield;
  }
}

function toShellGeometry(dots: ShellDots): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(dots.positions, 3));
  g.setAttribute("aScale", new BufferAttribute(dots.scales, 1));
  g.setAttribute("aBright", new BufferAttribute(dots.brights, 1));
  g.setAttribute("aSeed", new BufferAttribute(dots.seeds, 1));
  return g;
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
 *     side, then the core, then the near side;
 *   • yet solid to the rest of the system: an invisible depth-only sphere inside it
 *     hides what's behind the Sun (planets, the asteroid belt, orbit lines) — only
 *     while it's visible, so it never hides anything once the Sun has faded.
 *
 * Fades in with the system, out for the Earth dive, back in for the galaxy finale.
 * Every value is live-tunable from the dev panel (SunGui); shape values rebuild the dots.
 */
const Sun = ({ animate = true }: Props) => {
  const dpr = useThree((s) => s.viewport.dpr);
  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const version = useSunTuning((s) => s.version); // bumped by the panel's shape values
  const occluderRef = useRef<Mesh>(null);
  const farRef = useRef<Points>(null);
  const nearRef = useRef<Points>(null);

  // Its dots are built in idle time, in story order (P27-86, like the Saturn's): the Sun
  // only shows on the voyage, so they needn't hold up the first frame. Until then an empty
  // geometry stands in (it draws nothing). `version` rebuilds them from the tuned SUN.
  const placeholder = useMemo(() => new BufferGeometry(), []);
  const [geometry, setGeometry] = useState<BufferGeometry | null>(null);
  useEffect(() => {
    const count = isSmall ? SUN.countMobile : SUN.count;
    const dots = allocateShell(count);
    return sceneBuilds.add({
      name: "Sun",
      neededAt: SYSTEM_SHOWS_AT,
      steps: buildShell(count, dots),
      onDone: () => setGeometry(toShellGeometry(dots)),
    });
  }, [isSmall, version]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  useEffect(() => () => placeholder.dispose(), [placeholder]);

  const shared = useMemo(
    () => ({
      uTime: { value: 0 },
      uRadius: { value: SUN.radius },
      uReveal: { value: 0 },
    }),
    [],
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
  const dotMaterials = useMemo(() => [materials.far, materials.near], [materials]); // (not a new array each frame)
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials]);
  // While the Sun is faded out (before the voyage, the Earth, the Lab) its dots output
  // nothing — skip the draws.
  useDrawGate(farRef, () => shared.uReveal.value > 0);
  useDrawGate(nearRef, () => shared.uReveal.value > 0);

  useFrame((_, delta) => {
    if (animate && !SUN.paused) shared.uTime.value += delta;
    shared.uRadius.value = SUN.radius;
    // Live values (the dev panel tunes SUN in place).
    for (const m of dotMaterials) {
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
      setHexIfChanged(u.uCore.value, SUN.core);
      setHexIfChanged(u.uMid.value, SUN.mid);
      setHexIfChanged(u.uEdge.value, SUN.edge);
    }
    const voyage = useVoyageScroll.getState().progress;
    // Fade in with the system, then fade OUT as we dive to Earth — then fade BACK in as
    // we leave for the Parker Solar Probe (fading again as the Lab focuses on it, if
    // PARKER_FOCUS.fadeSun), and for the galaxy finale (sunReturn).
    const earthFade = remap01(voyage, VOYAGE.earthFadeStart, VOYAGE.earthFadeEnd);
    shared.uReveal.value =
      easeOutCubic(remap01(voyage, SOLAR.revealStart, SOLAR.revealEnd)) *
      (1 - earthFade * (1 - sunReturn()));
    if (occluderRef.current) {
      occluderRef.current.visible = shared.uReveal.value > 0.02;
      occluderRef.current.scale.setScalar(SUN.radius * 0.97);
    }
  });

  // Far side → the old Sun's halo, glowing core + drifting corona → near side.
  return (
    <group>
      <points
        ref={farRef}
        geometry={geometry ?? placeholder}
        material={materials.far}
        renderOrder={-4}
        frustumCulled={false}
      />
      <SunCore
        count={isSmall ? SUN_CORE.countMobile : SUN_CORE.count}
        version={version}
        animate={animate}
        time={shared.uTime}
        reveal={shared.uReveal}
        renderOrder={-2}
      />
      {/* Depth only, after the glow and before the near side and everything else. It
        must be transparent: three draws every opaque object before any transparent one,
        whatever its renderOrder, and it would then hide the glow inside. */}
      <mesh ref={occluderRef} renderOrder={-1.5} visible={false}>
        <sphereGeometry args={[1, 32, 16]} />
        <meshBasicMaterial colorWrite={false} transparent />
      </mesh>
      <points
        ref={nearRef}
        geometry={geometry ?? placeholder}
        material={materials.near}
        renderOrder={-1}
        frustumCulled={false}
      />
    </group>
  );
};

export default Sun;
