"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Group,
  Mesh,
  PerspectiveCamera,
  Sprite,
  SpriteMaterial,
  Vector3,
} from "three";
import { clamp01, damp, remap01 } from "#/components/three.js/star/utils";
import { ROTATION, labAt } from "#/components/three.js/star/config";
import { useLabScroll } from "#/stores/useLabScroll";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useParkerAnchor } from "#/stores/useParkerAnchor";
import { flyingSunPos } from "#/components/three.js/galaxy/spin";
import { LAB } from "#/components/three.js/voyager/config";
import { recordLabel, recordScreen } from "#/components/three.js/voyager/recordScreen";
import { LABEL_PRIORITY, projectToViewport } from "#/components/three.js/scene/labelProjection";
import { seg, type Vec3 } from "#/components/three.js/scene/strut";
import { METRE, PARKER, PARKER_CAM, PARKER_VIEW } from "./config";
import { parkerOrbit, parkerQuaternion, parkerSunDir } from "./pose";
import { dragMode } from "#/components/three.js/earth/interaction";

// ── Its layout, in metres (local frame: +Y at the Sun, the craft in the shield's shade) ──
const P = PARKER;
const BUS_Y = P.bus.top - P.bus.height / 2; // the bus's centre
const BUS_BOTTOM = P.bus.top - P.bus.height;
const APOTHEM = P.bus.radius * Math.cos(Math.PI / 6); // centre → middle of a hexagon face
/** A face of the hexagonal bus: its outward normal at angle θ (from +Z toward +X). */
const face = (theta: number, out: number, y: number): Vec3 => [
  Math.sin(theta) * (APOTHEM + out),
  y,
  Math.cos(theta) * (APOTHEM + out),
];
// The face the Lab's close-up sees: the high-gain antenna, the memory card below it.
const FRONT = P.front;

// Six struts from under the shield down to the bus.
const TRUSS = Array.from({ length: 6 }, (_, i) => {
  const a = (i * Math.PI) / 3 + Math.PI / 6;
  return seg(
    [Math.sin(a) * P.truss.top, -P.shield.thickness / 2, Math.cos(a) * P.truss.top],
    [Math.sin(a) * P.truss.bottom, P.bus.top, Math.cos(a) * P.truss.bottom]
  );
});

// The four FIELDS whips, 90° apart, in the shield's plane — rooted under its rim,
// reaching out past it into the sunlight.
const WHIPS = Array.from({ length: 4 }, (_, i) => {
  const a = P.whip.azimuth + (i * Math.PI) / 2;
  const tip = P.whip.root + P.whip.length;
  return seg(
    [Math.sin(a) * P.whip.root, P.whip.y, Math.cos(a) * P.whip.root],
    [Math.sin(a) * tip, P.whip.y, Math.cos(a) * tip]
  );
});

// The Solar Probe Cup on its short arm, peeking over the shield's rim (between whips).
const CUP_T: Vec3 = [0, 0.1, P.shield.radius + 0.14];
const CUP_ARM = seg([0, -P.shield.thickness / 2, P.shield.radius - 0.1], CUP_T);

// The magnetometer boom, pointing away from the Sun.
const BOOM_TIP = BUS_BOTTOM - P.boom.length;

/** A soft round glow, for the marker that stands in for the probe from afar. */
function makeGlow(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, color);
    g.addColorStop(1, "rgba(255,227,199,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }
  return new CanvasTexture(c);
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

/** After the CameraRig (0) has placed the camera this frame, before the labels (0.9). */
const DRAW_PRIORITY = 0.8;

/**
 * The Parker Solar Probe — a SOLID, lit craft built from primitive geometry to its
 * real proportions (see `config.ts`): the white-coated heat shield, the truss and
 * radiators, the hexagonal bus, the two swept solar arrays, the four FIELDS whips,
 * the Solar Probe Cup, the magnetometer boom, the high-gain antenna, WISPR, IS☉IS and
 * the peach memory card.
 *
 * It is drawn at its TRUE size, at its true position on its real orbit
 * (`useParkerAnchor`, set by ParkerMember): ~0.00000008 scene units across, far below
 * what a camera with a 0.1 near plane can render. So each frame, once the camera has
 * moved, it's drawn along its true direction from the camera but no nearer than
 * PARKER_VIEW.drawDistance, scaled up by the same factor — on screen that is identical
 * (same angle, same size) to the real 3 m probe at its real distance. From afar it is
 * less than a pixel: a fixed-size glowing marker stands in for it, cross-fading as the
 * model grows. Its heat shield always faces the Sun (from its live position), lit by a
 * directional light from the Sun.
 *
 * It shows from the moment you leave the Earth (the Lab beat), and in the finale
 * until it has shrunk away (the marker fades over PARKER_CAM.markerOut). At the
 * close-up, a drag orbits the camera round it (parkerOrbit) — it stays put. Its DOM label
 * reads "Parker Solar Probe" on the marker from afar, and becomes the memory card's
 * ("open the Lab") once you're there.
 */
const ParkerProbe = () => {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const rootRef = useRef<Group>(null); // placed + scaled each frame (see above)
  const markerRef = useRef<Sprite>(null);
  const sunRef = useRef<DirectionalLight>(null);
  const fillRef = useRef<DirectionalLight>(null);
  const cardRef = useRef<Mesh>(null);
  const scratch = useRef({ delta: new Vector3(), sunDir: new Vector3(), label: new Vector3() });
  const label = useRef<"off" | "probe" | "card">("off");

  // A drag at the close-up (dragMode "probe", decided on pointer-down) turns the probe and
  // the space together, exactly like dragging the Saturn (Universe): sideways only (unless
  // ROTATION.allowVerticalDrag), at the same speed and glide, and it stays where you leave
  // it. It's drawn by circling the camera round the probe — the same picture, and the
  // probe keeps its heat shield to the Sun.
  const orbitTarget = useRef({ yaw: 0, pitch: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const el = gl.domElement;
    const onDown = (e: PointerEvent) => {
      drag.current = { x: e.clientX, y: e.clientY };
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x;
      const dy = e.clientY - drag.current.y;
      drag.current = { x: e.clientX, y: e.clientY };
      if (dragMode.current !== "probe") return;
      orbitTarget.current.yaw -= dx * ROTATION.sensitivity;
      if (ROTATION.allowVerticalDrag) {
        orbitTarget.current.pitch = Math.max(-1.2, Math.min(1.2, orbitTarget.current.pitch + dy * ROTATION.sensitivity));
      }
    };
    const onUp = () => {
      drag.current = null;
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [gl]);

  // Ease the turn toward the drag (before the CameraRig reads it).
  useFrame(() => {
    parkerOrbit.yaw = damp(parkerOrbit.yaw, orbitTarget.current.yaw, ROTATION.damping);
    parkerOrbit.pitch = damp(parkerOrbit.pitch, orbitTarget.current.pitch, ROTATION.damping);
  });

  const glow = useMemo(() => makeGlow(PARKER_VIEW.markerColor), []);
  const markerMat = useMemo(
    () =>
      new SpriteMaterial({
        map: glow,
        sizeAttenuation: false, // a fixed size on screen
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        toneMapped: false,
        opacity: 0,
      }),
    [glow]
  );

  useFrame(() => {
    const root = rootRef.current;
    const marker = markerRef.current;
    if (!root || !marker) return;
    const lab = clamp01(useLabScroll.getState().progress);
    const galaxy = clamp01(useGalaxyScroll.getState().progress);
    // From leaving the Earth, until it has shrunk away in the finale.
    const on = lab > 0 && galaxy < PARKER_CAM.markerOut[1];
    if (!on) {
      root.visible = false;
      marker.visible = false;
      label.current = "off";
      return;
    }

    // Where it is (true), and how far from the camera.
    const a = useParkerAnchor.getState();
    const { delta, sunDir } = scratch.current;
    delta.set(a.x - camera.position.x, a.y - camera.position.y, a.z - camera.position.z);
    const d = delta.length();
    // Drawn along the same direction, no nearer than drawDistance, scaled to match.
    const k = Math.max(1, PARKER_VIEW.drawDistance / d);
    root.position.copy(camera.position).addScaledVector(delta, k);
    root.scale.setScalar(METRE * k);
    const sun = flyingSunPos();
    parkerQuaternion(root.quaternion, a.x, a.y, a.z, sun);

    // Its size on screen (the shield's width, CSS px) → the model or the marker.
    const fov = (camera as PerspectiveCamera).fov;
    const pxPerRad = size.height / 2 / Math.tan(((fov * Math.PI) / 180) / 2);
    const px = ((2 * PARKER.shield.radius * METRE) / d) * pxPerRad;
    root.visible = px >= PARKER_VIEW.modelMinPx;
    const markerIn =
      smoothstep(0, labAt(112), lab) * (1 - smoothstep(PARKER_CAM.markerOut[0], PARKER_CAM.markerOut[1], galaxy));
    const markerOpacity =
      markerIn * (1 - smoothstep(PARKER_VIEW.markerFade[0], PARKER_VIEW.markerFade[1], px));
    marker.visible = markerOpacity > 0.001;
    markerMat.opacity = markerOpacity;
    marker.position.copy(root.position);
    // sizeAttenuation off: its scale is an angle (radians) → markerPx on screen.
    marker.scale.setScalar(PARKER_VIEW.markerPx / pxPerRad);

    // Sunlight: a directional light from the Sun; and a soft fill from the camera's side.
    if (sunRef.current) {
      sunRef.current.position.copy(parkerSunDir(sunDir, a.x, a.y, a.z, sun));
    }
    if (fillRef.current) fillRef.current.position.copy(delta).multiplyScalar(-1 / d);

    // Its label, with no gap between the two: its name while it's a dot or still small;
    // the memory card (clickable, it opens the Lab) once it's clearly recognisable, on
    // the way in and on the way back out (the finale's pull-out).
    label.current =
      markerIn < 0.5 ? "off" : px >= PARKER_VIEW.cardLabelPx ? "card" : "probe";
  }, DRAW_PRIORITY);

  // Project the label's anchor once everything is placed, and lay it out in the same
  // step (before the frame is drawn).
  useFrame(() => {
    const out = scratch.current.label;
    const mode = label.current;
    const anchor = mode === "card" ? cardRef.current : mode === "probe" ? markerRef.current : null;
    const ahead = !!anchor && projectToViewport(anchor, camera, gl.domElement, out);
    recordScreen.x = out.x;
    recordScreen.y = out.y;
    recordScreen.shown = ahead;
    recordScreen.text = mode === "card" ? "card" : "probe";
    recordLabel.update?.();
  }, LABEL_PRIORITY);

  const c = P.colors;
  const S = P.shield;
  return (
    <>
      <directionalLight ref={sunRef} intensity={PARKER_VIEW.sunlight} color="#fff4e6" />
      <directionalLight ref={fillRef} intensity={PARKER_VIEW.fill} color={PARKER_VIEW.fillColor} />
      <sprite ref={markerRef} material={markerMat} visible={false} renderOrder={5} />
      <group ref={rootRef} visible={false}>
        <group position={[0, -P.pivotY, 0]}>
          {/* Heat shield: the carbon core, its white coat on the sunward face. */}
          <mesh>
            <cylinderGeometry args={[S.radius, S.radius, S.thickness, 64]} />
            <meshStandardMaterial color={c.carbon} metalness={0.2} roughness={0.75} />
          </mesh>
          <mesh position={[0, S.thickness / 2 + S.coat / 2, 0]}>
            <cylinderGeometry args={[S.radius - 0.02, S.radius - 0.02, S.coat, 64]} />
            <meshStandardMaterial color={c.shieldCoat} metalness={0} roughness={0.85} />
          </mesh>

          {/* Truss — struts from the shield down to the bus. */}
          {TRUSS.map((t, i) => (
            <mesh key={i} position={t.mid} quaternion={t.quat}>
              <cylinderGeometry args={[P.truss.radius, P.truss.radius, t.len, 6]} />
              <meshStandardMaterial color={c.carbon} metalness={0.3} roughness={0.6} />
            </mesh>
          ))}

          {/* Cooling radiators, just under the shield. */}
          {[0, 1, 2, 3].map((i) => {
            const a = (i * Math.PI) / 2 + Math.PI / 4;
            return (
              <mesh
                key={i}
                position={[Math.sin(a) * P.radiator.at, P.radiator.y, Math.cos(a) * P.radiator.at]}
                rotation={[0, a, 0]}
              >
                <boxGeometry args={[P.radiator.width, P.radiator.height, P.radiator.depth]} />
                <meshStandardMaterial color={c.light} metalness={0.5} roughness={0.4} />
              </mesh>
            );
          })}

          {/* Bus — the hexagonal body (black thermal blankets). */}
          <mesh position={[0, BUS_Y, 0]}>
            <cylinderGeometry args={[P.bus.radius, P.bus.radius, P.bus.height, 6]} />
            <meshStandardMaterial color={c.bus} metalness={0.35} roughness={0.55} />
          </mesh>

          {/* Solar arrays — two wings hinged on the bus, swept back into the shade. */}
          {[1, -1].map((s) => {
            const L = P.array.length;
            const hinge: Vec3 = [s * APOTHEM, P.array.hingeY, 0];
            const pos: Vec3 = [
              hinge[0] + s * Math.cos(P.array.sweep) * (L / 2),
              hinge[1] - Math.sin(P.array.sweep) * (L / 2),
              0,
            ];
            return (
              <group key={s} position={pos} rotation={[0, 0, -s * P.array.sweep]}>
                <mesh>
                  <boxGeometry args={[L, P.array.depth, P.array.width]} />
                  <meshStandardMaterial color={c.array} metalness={0.55} roughness={0.3} />
                </mesh>
                <mesh>
                  <boxGeometry args={[L + 0.05, P.array.depth * 0.6, P.array.width + 0.05]} />
                  <meshStandardMaterial color={c.frame} metalness={0.6} roughness={0.4} />
                </mesh>
              </group>
            );
          })}

          {/* FIELDS — the four niobium whips, out past the rim into the sunlight. */}
          {WHIPS.map((w, i) => (
            <mesh key={i} position={w.mid} quaternion={w.quat}>
              <cylinderGeometry args={[P.whip.radius, P.whip.radius, w.len, 6]} />
              <meshStandardMaterial color={c.niobium} metalness={0.8} roughness={0.3} />
            </mesh>
          ))}

          {/* SWEAP's Solar Probe Cup, peeking over the shield's rim. */}
          <mesh position={CUP_ARM.mid} quaternion={CUP_ARM.quat}>
            <cylinderGeometry args={[0.015, 0.015, CUP_ARM.len, 6]} />
            <meshStandardMaterial color={c.frame} metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={CUP_T}>
            <cylinderGeometry args={[P.cup.radius, P.cup.radius * 0.8, P.cup.height, 16]} />
            <meshStandardMaterial color={c.light} metalness={0.7} roughness={0.35} />
          </mesh>

          {/* Magnetometer boom, away from the Sun: three sensors + the short fifth antenna. */}
          <mesh position={[0, (BUS_BOTTOM + BOOM_TIP) / 2, 0]}>
            <cylinderGeometry args={[P.boom.radius, P.boom.radius, P.boom.length, 6]} />
            <meshStandardMaterial color={c.frame} metalness={0.6} roughness={0.45} />
          </mesh>
          {P.boom.sensors.map((d, i) => (
            <mesh key={i} position={[0, BUS_BOTTOM - d, 0]}>
              <boxGeometry args={[0.09, 0.09, 0.09]} />
              <meshStandardMaterial color={c.light} metalness={0.5} roughness={0.45} />
            </mesh>
          ))}
          <mesh position={[0, BUS_BOTTOM - P.boom.shortAntennaAt, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.008, 0.008, P.boom.shortAntenna, 6]} />
            <meshStandardMaterial color={c.niobium} metalness={0.8} roughness={0.3} />
          </mesh>

          {/* High-gain antenna — a small dish on the camera-side face… */}
          <group position={face(FRONT, 0.14, BUS_Y + 0.18)} rotation={[Math.PI / 2, 0, -FRONT]}>
            <mesh>
              <cylinderGeometry args={[P.hga.radius, 0.05, P.hga.depth, 28, 1, true]} />
              <meshStandardMaterial color={c.light} metalness={0.4} roughness={0.5} side={DoubleSide} />
            </mesh>
          </group>

          {/* …and below it, the memory card — 1.1 million names, glowing peach. */}
          <mesh ref={cardRef} position={face(FRONT, 0.008, BUS_Y - 0.28)} rotation={[0, FRONT, 0]}>
            <boxGeometry args={[P.card.width, P.card.height, P.card.depth]} />
            <meshStandardMaterial
              color={c.card}
              metalness={0.6}
              roughness={0.3}
              emissive={c.cardGlow}
              emissiveIntensity={0.6}
             
            />
          </mesh>

          {/* WISPR — the camera, a small box in the shade. */}
          <mesh position={face(FRONT + Math.PI * (2 / 3), 0.08, P.bus.top - 0.18)} rotation={[0, FRONT + Math.PI * (2 / 3), 0]}>
            <boxGeometry args={[0.3, 0.15, 0.16]} />
            <meshStandardMaterial color={c.light} metalness={0.5} roughness={0.45} />
          </mesh>

          {/* IS☉IS — an octagonal dome on the bus. */}
          <mesh position={face(FRONT - Math.PI * (2 / 3), 0.1, P.bus.top - 0.2)} rotation={[Math.PI / 2, 0, -(FRONT - Math.PI * (2 / 3))]}>
            <cylinderGeometry args={[0.13, 0.15, 0.14, 8]} />
            <meshStandardMaterial color={c.light} metalness={0.45} roughness={0.5} />
          </mesh>
        </group>
      </group>
    </>
  );
};

export default ParkerProbe;
