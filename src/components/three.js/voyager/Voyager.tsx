"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { DoubleSide, Group, Material, Mesh, Vector3 } from "three";
import { clamp01, easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { useLabScroll } from "#/stores/useLabScroll";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useSceneRotation } from "#/stores/useSceneRotation";
import { LAB, VOYAGER } from "./config";
import { recordLabel, recordScreen } from "./recordScreen";
import { LABEL_PRIORITY, projectToViewport } from "#/components/three.js/scene/labelProjection";
import { along, seg, type Vec3 } from "#/components/three.js/scene/strut";

// ── Attachment anchors on the bus → tips (everything roots on the ten-sided bus) ──
const NECK = seg([0, -0.34, -0.12], [0, 0.06, -0.26]); // bus top → dish underside
const MAG_A: Vec3 = [0.28, -0.42, 0];
const MAG_T: Vec3 = [2.5, 0.55, 0];
const MAG = seg(MAG_A, MAG_T);
const SCI_A: Vec3 = [-0.28, -0.52, 0.05];
const SCI_T: Vec3 = [-1.3, -1.4, 0.05];
const SCI = seg(SCI_A, SCI_T);
const RTG_A: Vec3 = [0.24, -0.64, 0.05];
const RTG_T: Vec3 = [1.75, -1.55, 0.05];
const RTG = seg(RTG_A, RTG_T);
const RTG_AT: Vec3[] = [0.52, 0.72, 0.92].map((t) => along(RTG_A, RTG_T, t));

/**
 * UNUSED since P27-72 — replaced by the Parker Solar Probe (`parker/ParkerProbe.tsx`);
 * kept for reference.
 *
 * Voyager 1 — a SOLID, lit craft built from primitive geometry (dish + rim +
 * feed, ten-sided bus, magnetometer / science / RTG booms, and a glowing Golden
 * Record). The camera flies to it during the Lab beat (see CameraRig). It fades
 * in over LAB.revealStart, and turns WITH the shared cosmos — it mirrors
 * `useSceneRotation` (exactly like the Saturn), so dragging rotates the space and
 * the craft as one rigid scene instead of spinning the probe on its own. The
 * Record's world position is projected into `recordScreen` each frame (once the
 * camera has moved) for the DOM label overlay. Needs scene lights (added in CosmicScene).
 */
const Voyager = () => {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);

  const rootRef = useRef<Group>(null); // visibility + opacity fade
  const spinRef = useRef<Group>(null); // mirrors the shared scene rotation
  const recordRef = useRef<Mesh>(null);
  const worldPos = useRef(new Vector3());
  const labelOn = useRef(false); // the Lab is in full view and the craft is shown

  useFrame(() => {
    const lab = clamp01(useLabScroll.getState().progress);
    // Hidden through the dust rush, then fades in over the last stretch so it
    // resolves directly at a readable size (never a tiny speck that zooms).
    // Then fades back OUT fast as the galaxy finale pulls the camera away (lab
    // clamps at 1 through the galaxy beat, so this fade is what hides the craft
    // + its Record label). visible=false also stops its per-frame work (perf).
    const galaxyFade = remap01(useGalaxyScroll.getState().progress, 0, 0.12);
    const reveal =
      easeOutCubic(remap01(lab, LAB.revealStart, LAB.revealEnd)) * (1 - galaxyFade);
    const visible = reveal > 0.001;

    if (rootRef.current) rootRef.current.visible = visible;
    labelOn.current = visible && lab >= LAB.recordLabelAt;
    if (!visible) return;
    // Fade the whole craft in/out via material opacity (materials are declared
    // `transparent`, so we only set the value here) — only while it's shown.
    rootRef.current?.traverse((o) => {
      const mesh = o as Mesh;
      const mat = mesh.material as Material | Material[] | undefined;
      if (!mat) return;
      if (Array.isArray(mat)) mat.forEach((m) => (m.opacity = reveal));
      else mat.opacity = reveal;
    });

    // Turn WITH the cosmos: mirror the shared scene rotation (drag + idle drift),
    // so the craft and the starfield rotate as one — it's part of the space, not
    // a probe spinning on its own. A fixed yaw offset keeps its designed facing.
    const r = useSceneRotation.getState();
    if (spinRef.current) {
      spinRef.current.rotation.set(r.pitch, r.yaw + VOYAGER.initialYaw, 0);
    }

  });

  // Project the Golden Record for the DOM label once the camera has moved this frame,
  // and lay the label out in the same step (before the frame is drawn).
  useFrame(() => {
    const ahead =
      labelOn.current &&
      !!recordRef.current &&
      projectToViewport(recordRef.current, camera, gl.domElement, worldPos.current);
    recordScreen.x = worldPos.current.x;
    recordScreen.y = worldPos.current.y;
    recordScreen.shown = ahead;
    recordLabel.update?.();
  }, LABEL_PRIORITY);

  const c = VOYAGER.colors;
  return (
    <group ref={rootRef} visible={false} scale={VOYAGER.scale}>
      <group ref={spinRef}>
        {/* High-gain dish — shallow open cone facing the camera (+Z), tilted up */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.14, -0.28]}>
          <coneGeometry args={[VOYAGER.dishRadius, VOYAGER.dishDepth, 44, 1, true]} />
          <meshStandardMaterial
            color={c.dish}
            metalness={0.35}
            roughness={0.55}
            side={DoubleSide}
            transparent
          />
        </mesh>
        {/* Dish rim */}
        <mesh position={[0, 0.32, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[VOYAGER.dishRadius, VOYAGER.rimTube, 10, 52]} />
          <meshStandardMaterial color={c.body} metalness={0.6} roughness={0.4} transparent />
        </mesh>
        {/* Feed mast + horn at the focus (in front of the dish) */}
        <mesh position={[0, 0.14, 0.28]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.014, 0.9, 6]} />
          <meshStandardMaterial color={c.boom} metalness={0.6} roughness={0.5} transparent />
        </mesh>
        <mesh position={[0, 0.14, 0.72]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.08, 0.16, 12]} />
          <meshStandardMaterial color={c.body} metalness={0.6} roughness={0.5} transparent />
        </mesh>

        {/* Neck — short mast joining the dish underside to the bus (no gap). */}
        <mesh position={NECK.mid} quaternion={NECK.quat}>
          <cylinderGeometry args={[0.11, 0.13, NECK.len, 12]} />
          <meshStandardMaterial color={c.body} metalness={0.6} roughness={0.5} transparent />
        </mesh>

        {/* Bus — ten-sided drum, the hub every boom roots on */}
        <mesh position={[0, -0.5, 0]}>
          <cylinderGeometry args={[VOYAGER.busRadius, VOYAGER.busRadius, VOYAGER.busHeight, 10]} />
          <meshStandardMaterial color={c.body} metalness={0.6} roughness={0.5} transparent />
        </mesh>

        {/* Golden Record — on the bus, facing out (glows) */}
        <mesh ref={recordRef} position={[0.12, -0.46, 0.33]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry
            args={[VOYAGER.record.radius, VOYAGER.record.radius, VOYAGER.record.thickness, 40]}
          />
          <meshStandardMaterial
            color={c.record}
            metalness={0.9}
            roughness={0.24}
            emissive={c.recordEmissive}
            emissiveIntensity={0.85}
            transparent
          />
        </mesh>

        {/* Magnetometer boom — long + thin, rooted on the bus, up-right */}
        <mesh position={MAG.mid} quaternion={MAG.quat}>
          <cylinderGeometry args={[0.016, 0.024, MAG.len, 6]} />
          <meshStandardMaterial color={c.boom} metalness={0.6} roughness={0.5} transparent />
        </mesh>
        <mesh position={MAG_T}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color={c.dark} metalness={0.6} roughness={0.5} transparent />
        </mesh>

        {/* Science boom + scan-platform (cameras), rooted on the bus, lower-left */}
        <mesh position={SCI.mid} quaternion={SCI.quat}>
          <cylinderGeometry args={[0.028, 0.036, SCI.len, 8]} />
          <meshStandardMaterial color={c.boom} metalness={0.6} roughness={0.5} transparent />
        </mesh>
        <mesh position={SCI_T}>
          <boxGeometry args={[0.26, 0.26, 0.24]} />
          <meshStandardMaterial color={c.body} metalness={0.55} roughness={0.5} transparent />
        </mesh>
        <mesh position={[SCI_T[0], SCI_T[1], SCI_T[2] + 0.16]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.08, 16]} />
          <meshStandardMaterial color={c.dark} metalness={0.7} roughness={0.35} transparent />
        </mesh>

        {/* RTG boom + three cylindrical generators strung along it, lower-right */}
        <mesh position={RTG.mid} quaternion={RTG.quat}>
          <cylinderGeometry args={[0.03, 0.04, RTG.len, 8]} />
          <meshStandardMaterial color={c.boom} metalness={0.6} roughness={0.5} transparent />
        </mesh>
        {RTG_AT.map((p, i) => (
          <mesh key={i} position={p} quaternion={RTG.quat}>
            <cylinderGeometry args={[0.11, 0.11, 0.3, 16]} />
            <meshStandardMaterial color={c.dark} metalness={0.6} roughness={0.5} transparent />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export default Voyager;
