"use client";

import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { RefObject, useEffect, useMemo, useRef } from "react";
import {
  AddEquation,
  AdditiveBlending,
  Color,
  CustomBlending,
  Group,
  HalfFloatType,
  LinearSRGBColorSpace,
  Mesh,
  MultiplyBlending,
  OneFactor,
  Points,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderTarget,
} from "three";
import { clamp01, easeInOutCubic, easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useLabScroll } from "#/stores/useLabScroll";
import { GALAXY, GALAXY_CENTER, GALAXY_FX, GALAXY_SCALE, GALAXY_SPACE, GALAXY_TILT } from "./config";
import { buildGalaxyLayers, GalaxyLayers } from "./buildGalaxy";
import { galaxyTuning } from "./tuning";
import { advanceSolarFly, galaxyCenterPos, galaxyDrag, updateGalaxyDrag } from "./spin";
import { SKY_END_VIEW } from "./sky";
import { galaxyFraming } from "./framing";
import GalaxySparkles from "./GalaxySparkles";
import SpaceStars from "./SpaceStars";
import DistantGalaxies from "./DistantGalaxies";
import { GalaxyBloom } from "./GalaxyBloom";
import {
  COMPOSITE_FRAG,
  COMPOSITE_VERT,
  CORE_FRAG,
  CORE_VERT,
  DOT_FRAG,
  DOT_VERT,
  DUST_FRAG,
  DUST_VERT,
  GLOW_FRAG,
  GLOW_VERT,
} from "./shaders";

/**
 * The realistic, brand-tinted spiral galaxy — the finale. Four point-cloud layers
 * built from ONE arm model (`buildGalaxyLayers`), plus a warm core glow:
 *
 *   glow  → soft milky starlight (additive, real size in space)
 *   stars → the dots (additive, FIXED on-screen size — never balloon up close)
 *   dust  → dark-peach brown lanes on the arms' inner edge (multiplied: pure
 *           absorption, so it only shows where there's light behind it)
 *   knots → coral-pink star-forming regions + young blue clusters (above the dust)
 *
 * Glow and dust fade out near the camera, so from inside the galaxy they only show
 * in the distance — a Milky-Way band with dust — and never turn into blobs.
 *
 * ── Its own display-space layer ──
 * The look was tuned in `docs/prototypes/galaxy-zoom-realistic.html`, where light
 * adds up in SCREEN colours. The site mixes light in linear space, which lifts faint
 * values (hazy "bubbles", faint rings) and weakens the dust. So the galaxy (+ its
 * sparkles) lives in its own scene, rendered each frame — after the camera has moved
 * — into a half-float target with the prototype's exact maths, then added to the
 * main scene ONCE, converted to linear (`COMPOSITE_FRAG`). It gets its own bloom in
 * the same screen values (`GalaxyBloom`), like the prototype's. It matches the
 * prototype, the rest of the site is untouched, and the dust can never darken the
 * solar system flying through it.
 *
 * Built in its own plane, tilted to the locked look-study pose (inclination + roll)
 * and centred at `GALAXY_CENTER` (scaled by `GALAXY_SCALE`), so the real Sun sits ~⅔
 * out in one arm. It turns gently on its own axis; the CameraRig pulls back to frame
 * it. Reveal is driven by `useGalaxyScroll`; while hidden, nothing is rendered.
 *
 * ── Part of space ──
 * It sits IN the universe, not on a backdrop: the sky frame (`sky.ts`) around it holds
 * a deep field of far stars, a few distant galaxies and the sparkles (all under the
 * dust, which darkens what's behind the lanes); its rim melts into that space (soft
 * edges); and a drag turns the galaxy and its sky together with the rest of the
 * cosmos, about the Sun (`galaxyDrag`, see galaxy/spin.ts).
 */
const Galaxy = ({ animate = true }: { animate?: boolean }) => {
  const rootRef = useRef<Group>(null);
  const spinRef = useRef<Group>(null);
  const coreRef = useRef<Mesh>(null);
  const skyRef = useRef<Group>(null);
  const compositeRef = useRef<Mesh>(null);
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const mainScene = useThree((s) => s.scene);
  const dpr = useThree((s) => s.viewport.dpr);

  const isSmall = typeof window !== "undefined" && window.innerWidth < 768;
  const aux = isSmall ? GALAXY.auxMobile : 1;

  // The four point layers are built (and REbuilt, when a shape value is tuned — see
  // galaxy/tuning.ts) imperatively in the frame loop and swapped onto these points, so
  // a React re-render can never reattach a stale geometry.
  const tiltRef = useRef<Group>(null);
  const glowPts = useRef<Points>(null);
  const starPts = useRef<Points>(null);
  const dustPts = useRef<Points>(null);
  const knotPts = useRef<Points>(null);
  const layersRef = useRef<GalaxyLayers | null>(null);
  const builtVersion = useRef(-1);
  useEffect(
    () => () => {
      const L = layersRef.current;
      if (L) [L.stars, L.knots, L.glow, L.dust].forEach((g) => g.dispose());
    },
    []
  );

  // Uniforms shared by every layer (one reveal, one clock, one shear, one near fade).
  const shared = useMemo(
    () => ({
      uTime: { value: 0 },
      uDiff: { value: GALAXY.differential },
      uPixelRatio: { value: 1 },
      uReveal: { value: 0 },
      uFlight: { value: 1 },
      uNearA: { value: GALAXY.nearFadeStart * GALAXY_SCALE },
      uNearB: { value: GALAXY.nearFadeEnd * GALAXY_SCALE },
    }),
    []
  );
  useEffect(() => {
    shared.uPixelRatio.value = dpr; // the canvas's real pixel ratio → sizes match the prototype
  }, [dpr, shared]);

  const materials = useMemo(() => {
    const base = { transparent: true, depthWrite: false, depthTest: false };
    const dots = (boost: number) =>
      new ShaderMaterial({
        ...base,
        blending: AdditiveBlending,
        uniforms: {
          ...shared,
          uSize: { value: GALAXY.uSize },
          uTwinkleAmt: { value: GALAXY.twinkleAmount },
          uBoost: { value: boost },
        },
        vertexShader: DOT_VERT,
        fragmentShader: DOT_FRAG,
      });
    return {
      stars: dots(1),
      knots: dots(GALAXY.knotBrightness),
      glow: new ShaderMaterial({
        ...base,
        blending: AdditiveBlending,
        uniforms: {
          ...shared,
          uGlowSize: { value: GALAXY.glowSize * GALAXY_SCALE },
          uGlowAmt: { value: GALAXY.glowAmount },
          uEdgeSoft: { value: GALAXY.edgeSoftness },
        },
        vertexShader: GLOW_VERT,
        fragmentShader: GLOW_FRAG,
      }),
      dust: new ShaderMaterial({
        ...base,
        blending: MultiplyBlending,
        premultipliedAlpha: true, // required by three's MultiplyBlending (see DUST_FRAG)
        uniforms: {
          ...shared,
          uDustSize: { value: GALAXY.dustSize * GALAXY_SCALE },
          uDustOpacity: { value: GALAXY.dustOpacity },
        },
        vertexShader: DUST_VERT,
        fragmentShader: DUST_FRAG,
      }),
      core: new ShaderMaterial({
        ...base,
        blending: AdditiveBlending,
        uniforms: { uOpacity: { value: 0 }, uCoreLift: { value: 0 } },
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
      }),
    };
  }, [shared]);
  useEffect(
    () => () => Object.values(materials).forEach((m) => m.dispose()),
    [materials]
  );

  // ── the galaxy's own layer ──
  const galaxyScene = useMemo(() => new Scene(), []);
  const target = useMemo(
    () =>
      new WebGLRenderTarget(1, 1, {
        type: HalfFloatType, // headroom above 1 for the dense core (rolled off later)
        depthBuffer: false,
        stencilBuffer: false,
      }),
    []
  );
  useEffect(() => () => target.dispose(), [target]);
  const bloom = useMemo(
    () =>
      new GalaxyBloom(gl, {
        threshold: GALAXY_FX.bloomThreshold,
        radius: GALAXY_FX.bloomRadius,
      }),
    [gl]
  );
  useEffect(() => () => bloom.dispose(), [bloom]);
  const composite = useMemo(
    () =>
      new ShaderMaterial({
        transparent: true,
        depthWrite: false,
        depthTest: false,
        // Add the light (rgb) and its coverage (alpha) on top of the scene.
        blending: CustomBlending,
        blendEquation: AddEquation,
        blendSrc: OneFactor,
        blendDst: OneFactor,
        blendEquationAlpha: AddEquation,
        blendSrcAlpha: OneFactor,
        blendDstAlpha: OneFactor,
        uniforms: {
          tGalaxy: { value: target.texture },
          tBloom: { value: bloom.texture },
          uBloom: { value: GALAXY_FX.bloomStrength },
          // the page colour as raw screen values (no colour-management conversion)
          uBg: { value: new Color().setStyle(GALAXY_FX.pageBackground, LinearSRGBColorSpace) },
          uFill: { value: 0 },
        },
        vertexShader: COMPOSITE_VERT,
        fragmentShader: COMPOSITE_FRAG,
      }),
    [target, bloom]
  );
  useEffect(() => () => composite.dispose(), [composite]);

  // The solar system's flight through the arm (galaxy/spin.ts) — BEFORE every other
  // frame callback, so everything flying with it (planets, Voyager, camera) reads the
  // same position this frame.
  useFrame((_, delta) => advanceSolarFly(delta, animate), -1);

  // Scroll-driven state + live-tunable values (normal priority).
  useFrame((_, delta) => {
    // The drag turn (after the Universe has published this frame's scene rotation);
    // the CameraRig reads the same value.
    updateGalaxyDrag();

    // (Re)build the layers on first frame, and whenever a shape value was tuned.
    if (builtVersion.current !== galaxyTuning.shapeVersion) {
      const old = layersRef.current;
      const next = buildGalaxyLayers(isSmall ? GALAXY.countMobile : GALAXY.count, aux);
      const pairs: [RefObject<Points | null>, GalaxyLayers[keyof GalaxyLayers]][] = [
        [glowPts, next.glow],
        [starPts, next.stars],
        [dustPts, next.dust],
        [knotPts, next.knots],
      ];
      for (const [ref, geometry] of pairs) {
        if (!ref.current) continue;
        if (!old) ref.current.geometry.dispose(); // R3F's empty placeholder
        ref.current.geometry = geometry;
      }
      if (old) [old.stars, old.knots, old.glow, old.dust].forEach((g) => g.dispose());
      layersRef.current = next;
      builtVersion.current = galaxyTuning.shapeVersion;
    }

    // Live values — GALAXY / GALAXY_FX can be tuned at runtime (GalaxyGui).
    shared.uDiff.value = GALAXY.differential;
    shared.uNearA.value = GALAXY.nearFadeStart * GALAXY_SCALE;
    shared.uNearB.value = Math.max(GALAXY.nearFadeEnd, GALAXY.nearFadeStart + 0.1) * GALAXY_SCALE;
    for (const m of [materials.stars, materials.knots]) {
      m.uniforms.uSize.value = GALAXY.uSize;
      m.uniforms.uTwinkleAmt.value = GALAXY.twinkleAmount;
    }
    materials.knots.uniforms.uBoost.value = GALAXY.knotBrightness;
    materials.glow.uniforms.uGlowAmt.value = GALAXY.glowAmount;
    materials.glow.uniforms.uGlowSize.value = GALAXY.glowSize * GALAXY_SCALE;
    materials.glow.uniforms.uEdgeSoft.value = GALAXY.edgeSoftness;
    materials.dust.uniforms.uDustOpacity.value = GALAXY.dustOpacity;
    materials.dust.uniforms.uDustSize.value = GALAXY.dustSize * GALAXY_SCALE;
    bloom.threshold = GALAXY_FX.bloomThreshold;
    bloom.radius = GALAXY_FX.bloomRadius;
    if (glowPts.current) glowPts.current.visible = GALAXY_FX.showGlow;
    if (dustPts.current) dustPts.current.visible = GALAXY_FX.showDust;
    if (coreRef.current) coreRef.current.scale.setScalar(GALAXY.coreScale * GALAXY.bulgeRadius);
    // Live placement: the centre + the drag turn about the Sun (pose / size tuning also
    // re-places the galaxy, so the Sun stays in its arm).
    if (rootRef.current) {
      const c = galaxyCenterPos();
      rootRef.current.position.set(c[0], c[1], c[2]);
      rootRef.current.quaternion.copy(galaxyDrag);
    }
    if (tiltRef.current) tiltRef.current.rotation.set(GALAXY_TILT[0], GALAXY_TILT[1], GALAXY_TILT[2]);

    const p = clamp01(useGalaxyScroll.getState().progress);
    const reveal = easeOutCubic(remap01(p, GALAXY.revealStart, GALAXY.revealEnd));
    if (rootRef.current) rootRef.current.visible = reveal > 0.001;
    shared.uReveal.value = reveal;
    // Dots a little brighter during the flight out through the galaxy (back to the
    // tuned look once the full view settles).
    const flight = easeInOutCubic(
      remap01(p, GALAXY.flightBoostIn[0], GALAXY.flightBoostIn[1]) *
        (1 - remap01(p, GALAXY.flightBoostOut[0], GALAXY.flightBoostOut[1]))
    );
    shared.uFlight.value = 1 + GALAXY.flightBoost * flight;
    // Bake in the page background quickly as the galaxy starts to appear (see
    // COMPOSITE_FRAG), so it's in place long before the galaxy is noticeable.
    composite.uniforms.uFill.value = remap01(p, GALAXY.revealStart, GALAXY.revealStart + 0.06);
    if (animate) shared.uTime.value += delta;
    // The core glows in LATER (while we look at the Sun it stays quiet) — plus a warm
    // lift of its bright centre during the flight, so from inside the galaxy the bulge
    // reads as luminous.
    materials.core.uniforms.uOpacity.value =
      GALAXY.coreOpacity * remap01(p, GALAXY.coreGlowIn[0], GALAXY.coreGlowIn[1]);
    materials.core.uniforms.uCoreLift.value = GALAXY.coreFlightBoost * flight;
    if (animate && !GALAXY.paused && spinRef.current) {
      spinRef.current.rotation.y += GALAXY.spinSpeed * delta;
    }
    // The deep stars come in earlier than the galaxy itself (they take over from the
    // near starfield), so the layer is drawn from then on.
    const starsOn =
      GALAXY_SPACE.showStars && remap01(p, GALAXY_SPACE.starsIn[0], GALAXY_SPACE.starsIn[1]) > 0.001;
    layerOn.current = (rootRef.current?.visible ?? false) || starsOn;
  });

  // Draw the galaxy layer — priority 0.5: after every normal frame callback (so the
  // CameraRig has already moved the camera), before the composer renders (priority 1).
  const layerOn = useRef(false);
  const bufferSize = useMemo(() => new Vector2(), []);
  const savedClear = useMemo(() => new Color(), []);
  const inverseDrag = useMemo(() => new Quaternion(), []);
  const warmed = useRef(false);
  useFrame(() => {
    // Once, midway through the Lab (well before the galaxy first shows), compile the
    // galaxy's shaders — so its first appearance doesn't stutter. They're compiled with
    // its render target bound (the variant they're drawn with), all offscreen: nothing
    // on screen changes. (Jumping straight into the finale compiles on first use, as before.)
    if (!warmed.current && useLabScroll.getState().progress > 0.5) {
      warmed.current = true;
      gl.getDrawingBufferSize(bufferSize);
      if (target.width !== bufferSize.x || target.height !== bufferSize.y) {
        target.setSize(bufferSize.x, bufferSize.y);
      }
      const prevTarget = gl.getRenderTarget();
      const prevAlpha = gl.getClearAlpha();
      const prevAutoClear = gl.autoClear;
      gl.getClearColor(savedClear);
      gl.setRenderTarget(target);
      gl.setClearColor(0x000000, 0);
      gl.autoClear = false;
      gl.compile(galaxyScene, camera);
      if (compositeRef.current) gl.compile(compositeRef.current, camera, mainScene);
      bloom.render(gl, target); // its passes compile on first use
      gl.setRenderTarget(prevTarget);
      gl.setClearColor(savedClear, prevAlpha);
      gl.autoClear = prevAutoClear;
    }
    const on = layerOn.current;
    if (compositeRef.current) compositeRef.current.visible = on;
    if (!on) return;
    const galaxyOn = !!rootRef.current?.visible;
    // Billboard the core (undoing the drag turn its parent carries).
    if (coreRef.current) {
      coreRef.current.quaternion.copy(inverseDrag.copy(galaxyDrag).invert()).multiply(camera.quaternion);
    }
    // The sky: pinned to the camera (infinitely far), oriented like the end view,
    // turned by the drag with the galaxy — and by the framing turn (so centring the
    // galaxy moves only the galaxy; the sky keeps its designed layout).
    if (skyRef.current) {
      skyRef.current.position.copy(camera.position);
      skyRef.current.quaternion
        .copy(galaxyFraming.correction)
        .multiply(galaxyDrag)
        .multiply(SKY_END_VIEW);
    }
    gl.getDrawingBufferSize(bufferSize);
    if (target.width !== bufferSize.x || target.height !== bufferSize.y) {
      target.setSize(bufferSize.x, bufferSize.y);
    }
    const prevTarget = gl.getRenderTarget();
    const prevAlpha = gl.getClearAlpha();
    const prevAutoClear = gl.autoClear;
    gl.getClearColor(savedClear);
    gl.setRenderTarget(target);
    gl.setClearColor(0x000000, 0);
    gl.autoClear = false;
    gl.clear(true, false, false);
    gl.render(galaxyScene, camera);
    // The galaxy's own bloom (the faint sky alone never reaches the threshold).
    const bloomOn = GALAXY_FX.showBloom && galaxyOn;
    if (bloomOn) bloom.render(gl, target);
    composite.uniforms.uBloom.value = bloomOn ? GALAXY_FX.bloomStrength : 0;
    gl.setRenderTarget(prevTarget);
    gl.setClearColor(savedClear, prevAlpha);
    gl.autoClear = prevAutoClear;
  }, 0.5);

  return (
    <>
      {createPortal(
        <>
          <group ref={rootRef} position={GALAXY_CENTER} scale={GALAXY_SCALE} visible={false}>
            {/* Warm core glow — a camera-facing plane at the galaxy centre. */}
            <mesh
              ref={coreRef}
              scale={GALAXY.coreScale * GALAXY.bulgeRadius}
              material={materials.core}
              renderOrder={2}
              frustumCulled={false}
            >
              <planeGeometry args={[1, 1]} />
            </mesh>

            {/* The disc, tilted to the locked look-study pose (inclination + roll baked
                in), turning gently on its own axis inside the tilt. Draw order: glow →
                core → stars → dust → pink regions (→ sparkles). */}
            <group ref={tiltRef} rotation={GALAXY_TILT}>
              <group ref={spinRef}>
                <points ref={glowPts} material={materials.glow} renderOrder={1} frustumCulled={false} />
                <points ref={starPts} material={materials.stars} renderOrder={3} frustumCulled={false} />
                <points ref={dustPts} material={materials.dust} renderOrder={4} frustumCulled={false} />
                <points ref={knotPts} material={materials.knots} renderOrder={5} frustumCulled={false} />
              </group>
            </group>
          </group>

          {/* The sky around it (pinned to the camera — see sky.ts), drawn FIRST so
              the galaxy's dust darkens the far stars behind the lanes. */}
          <group ref={skyRef}>
            <SpaceStars />
            <DistantGalaxies />
            <GalaxySparkles animate={animate} />
          </group>
        </>,
        galaxyScene
      )}

      {/* The galaxy layer, added to the scene LAST: it's pure additive light, so order
          doesn't change its look — but drawn last, nothing dark (the planets' shaded
          sides, orbit lines) can paint holes in it once the system is a speck. */}
      <mesh ref={compositeRef} material={composite} renderOrder={100} frustumCulled={false} visible={false}>
        <planeGeometry args={[2, 2]} />
      </mesh>
    </>
  );
};

export default Galaxy;
