"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  BufferGeometry,
  CanvasTexture,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  Points,
  PointsMaterial,
  Vector3,
} from "three";
import { flyingSunPos } from "#/components/three.js/galaxy/spin";
import { setHexIfChanged } from "#/components/three.js/scene/colorCache";
import { LABEL_PRIORITY, projectPointToViewport } from "#/components/three.js/scene/labelProjection";
import { sceneBuilds } from "#/components/three.js/scene/sceneBuilds";
import { storyEase } from "#/components/three.js/scene/storyMotion";
import { preupload, whenIdle } from "#/components/three.js/scene/warmUp";
import { SOLAR } from "#/components/three.js/solar/config";
import { ORBIT_PRIORITY } from "#/components/three.js/solar/planetTuning";
import { labFocus } from "#/components/three.js/solar/reveal";
import { JOURNEY } from "#/components/three.js/star/config";
import { clamp01, easeOutCubic, remap01 } from "#/components/three.js/star/utils";
import { useGalaxyScroll } from "#/stores/useGalaxyScroll";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { useLabScroll } from "#/stores/useLabScroll";
import { useParkerAnchor } from "#/stores/useParkerAnchor";
import { useSceneRotation } from "#/stores/useSceneRotation";
import { PARKER_CAM, PARKER_JOURNEY, PARKER_VIEW } from "./config";
import {
  buildJourney,
  closestAt,
  journeyPoint,
  journeyTipAt,
  millionKmFromSun,
  type JourneyData,
  type JourneyLine,
} from "./journey";
import { journeyLabels, journeyScreen } from "./journeyScreen";
import { julianNow } from "./orbit";

const DATA_URL = "/data/parker-journey.json";
/** At the latest this long after load, the recorded path starts loading anyway (ms). */
const LOAD_IDLE_TIMEOUT_MS = 3000;
/** …or as soon as the journey gets this close to the Lab (a jump right after load). */
const LOAD_AHEAD_MP = 0.1;
/** Markers closer than this (scene units) share a spot, and a label. */
const SAME_SPOT = 0.1;
/** A marker's label waits until the tip has moved on this far (days), out from under its own label. */
const LABEL_AFTER_DAYS = 30;
/** The tip's label hides once it's this close to the probe on screen (px): they've met. */
const TIP_MEETS_PX = 28;

const smoothstep = (a: number, b: number, x: number) => {
  const t = remap01(x, a, b);
  return t * t * (3 - 2 * t);
};

type Built = {
  line: JourneyLine;
  /** Its record, the closest it has ever come (millions of km): the tip's label changes there. */
  record: string;
  geometry: BufferGeometry;
  /** The markers (launch, flybys 1–7), relative to the Sun, and their day since launch. */
  markers: Vector3[];
  markerDays: number[];
  /** Each marker's spot: the first marker at the same place (itself if it's the first). */
  spots: number[];
};

/** A soft round dot for the markers. */
function dotTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}

/**
 * Parker's journey from the Earth (P27-72), NASA-Eyes style: its real recorded path
 * (JPL Horizons) from the 2018 launch, through its 7 Venus flybys and their ever
 * tighter loops, to the live probe today — a thin line, with dots + labels at the
 * launch and the flybys.
 *
 * It lies on the planets' orbit lines (same frame, same distance compression; it moves
 * with the Sun and the scene's drag, like them). It draws itself over the whole Lab
 * trip: from the launch as you leave the Earth, in step with the dive, to the probe —
 * today — as you arrive there, a dot riding its tip with how close it has come to the
 * Sun yet (it only shrinks, loop by loop, to its record). It
 * stays through the dive and the close-up (the flyby labels go with the planets), and
 * fades with the probe's marker in the finale. The path loads in idle time and is built
 * by the scene's build queue.
 */
const ParkerJourney = () => {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const sysRef = useRef<Group>(null);
  const rotRef = useRef<Group>(null);
  const built = useRef<Built | null>(null);

  const line = useMemo(
    () =>
      new Line(
        new BufferGeometry(),
        new LineBasicMaterial({
          color: PARKER_JOURNEY.color,
          transparent: true,
          opacity: 0,
          depthWrite: false,
        }),
      ),
    [],
  );
  // The last stretch, from the last whole point behind the tip to the tip itself, so the
  // line grows smoothly rather than a point at a time.
  const tipLine = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(2 * 3), 3));
    const segment = new Line(geometry, line.material);
    segment.frustumCulled = false;
    return segment;
  }, [line]);
  const dots = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(8 * 3), 3));
    return new Points(
      geometry,
      new PointsMaterial({
        color: PARKER_JOURNEY.color,
        map: dotTexture(),
        size: PARKER_JOURNEY.dotPx,
        sizeAttenuation: false,
        transparent: true,
        depthWrite: false,
        opacity: 0,
      }),
    );
  }, []);
  // The tip's dot: placed in the world each frame, along its true direction from the
  // camera but no nearer than the probe is drawn (PARKER_VIEW.drawDistance) — so it still
  // shows, and meets the probe, at the close-up, far inside the camera's near plane.
  const tipDot = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(new Float32Array(3), 3));
    const dot = new Points(geometry, dots.material);
    dot.frustumCulled = false;
    return dot;
  }, [dots]);
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as LineBasicMaterial).dispose();
      tipLine.geometry.dispose();
      tipDot.geometry.dispose();
      dots.geometry.dispose();
      const m = dots.material as PointsMaterial;
      m.map?.dispose();
      m.dispose();
    },
    [line, tipLine, tipDot, dots],
  );

  // Load the recorded path once the page is idle (or the journey heads for the Lab),
  // then build the line in the build queue's idle slices, in story order.
  useEffect(() => {
    let cancelled = false;
    let started = false;
    let cancelJob = () => {};
    const start = () => {
      if (started) return;
      started = true;
      fetch(DATA_URL)
        .then((res) => res.json() as Promise<JourneyData>)
        .then((data) => {
          if (cancelled) return;
          const result: { line?: JourneyLine } = {};
          cancelJob = sceneBuilds.add({
            name: "Parker's journey",
            neededAt: JOURNEY.earthDwellEnd,
            steps: (function* () {
              result.line = yield* buildJourney(data, julianNow());
            })(),
            onDone: () => {
              if (!result.line) return;
              const geometry = new BufferGeometry();
              geometry.setAttribute("position", new Float32BufferAttribute(result.line.positions, 3));
              line.geometry.dispose();
              line.geometry = geometry;
              const markers = [
                journeyPoint(data.points[0], data.points[1], data.points[2], new Vector3()),
                ...data.flybys.map(({ at }) => journeyPoint(at[0], at[1], at[2], new Vector3())),
              ];
              const at = dots.geometry.getAttribute("position") as Float32BufferAttribute;
              markers.forEach((m, i) => at.setXYZ(i, m.x, m.y, m.z));
              at.needsUpdate = true;
              dots.geometry.computeBoundingSphere();
              const journey = result.line;
              // How close the loops reach after the launch and after each flyby.
              journeyScreen.reach = [0, ...data.flybys.map((f) => f.day)].map((day, i) => {
                const after = i === 0 ? undefined : data.perihelia.find((p) => p.day > day);
                return millionKmFromSun(after ? after.au : journey.au[0]);
              });
              built.current = {
                line: journey,
                record: millionKmFromSun(journey.closest[journey.count - 1]),
                geometry,
                markers,
                markerDays: [0, ...data.flybys.map((f) => f.day)],
                spots: markers.map((m) => markers.findIndex((o) => o.distanceTo(m) < SAME_SPOT)),
              };
              if (rotRef.current) preupload(gl, rotRef.current, camera);
            },
          });
        })
        .catch(() => {
          // No path, no line: the probe and its trip are unchanged.
        });
    };
    const cancelIdle = whenIdle(start, LOAD_IDLE_TIMEOUT_MS);
    const near = (mp: number) => mp >= JOURNEY.earthDwellEnd - LOAD_AHEAD_MP;
    if (near(useJourneyScroll.getState().progress)) start();
    const unsubscribe = useJourneyScroll.subscribe((s) => near(s.progress) && start());
    return () => {
      cancelled = true;
      cancelIdle();
      unsubscribe();
      cancelJob();
    };
  }, [gl, camera, line, dots]);

  // Where the journey has got to, shared by both steps of the frame.
  const now = useRef({
    on: false,
    reveal: 0,
    done: false,
    day: -1,
    reached: 0,
    km: "",
  });
  const tip = useMemo(() => new Vector3(), []); // relative to the Sun
  const tipWorld = useMemo(() => new Vector3(), []);
  const scratch = useMemo(() => new Vector3(), []);
  const probe = useMemo(() => new Vector3(), []);
  const hidden = useRef(true);

  // On the orbit lines' frame: centred on the (flying) Sun, turned with the scene's drag.
  // Then how much is drawn, and where its tip is.
  useFrame(() => {
    const rot = rotRef.current;
    if (rot) {
      const r = useSceneRotation.getState();
      rot.rotation.set(r.pitch, r.yaw, 0);
    }
    const sun = flyingSunPos();
    sysRef.current?.position.set(sun[0], sun[1], sun[2]);

    const f = now.current;
    const lab = clamp01(useLabScroll.getState().progress);
    const galaxy = clamp01(useGalaxyScroll.getState().progress);
    // From leaving the Earth until the probe's marker has shrunk away in the finale.
    f.on = lab > 0 && galaxy < PARKER_CAM.markerOut[1];
    // In with the solar system as you leave the Earth, out with the probe's marker.
    f.reveal = f.on
      ? easeOutCubic(remap01(lab, SOLAR.labReturn[0], SOLAR.labReturn[1])) *
        (1 - smoothstep(PARKER_CAM.markerOut[0], PARKER_CAM.markerOut[1], galaxy))
      : 0;
    const b = built.current;
    const visible = !!b && f.reveal > 0.001;
    line.visible = visible;
    dots.visible = visible;
    if (!b || !visible) {
      tipLine.visible = false;
      tipDot.visible = false;
      return;
    }

    // Drawn from the launch to today over the whole trip, in step with the dive.
    const t = remap01(lab, PARKER_JOURNEY.draw[0], PARKER_JOURNEY.draw[1]);
    f.done = t >= 1;
    const day = f.done ? b.line.today : storyEase(t) * b.line.today;
    const whole = journeyTipAt(b.line, day, tip);
    if (day !== f.day) {
      f.day = day;
      b.geometry.setDrawRange(0, whole);
      const at = tipLine.geometry.getAttribute("position") as Float32BufferAttribute;
      const p = b.line.positions;
      const k = (whole - 1) * 3;
      at.setXYZ(0, p[k], p[k + 1], p[k + 2]);
      at.setXYZ(1, tip.x, tip.y, tip.z);
      at.needsUpdate = true;
      f.reached = 0;
      while (f.reached < b.markerDays.length && b.markerDays[f.reached] <= day) f.reached++;
      dots.geometry.setDrawRange(0, f.reached);
    }
    tipLine.visible = whole < b.line.count;
    // The tip in the world (its dot is placed once the camera has moved), and how close
    // it has come to the Sun yet.
    tipDot.visible = !f.done;
    if (rot) tipWorld.copy(tip).applyEuler(rot.rotation).add(scratch.set(sun[0], sun[1], sun[2]));
    const km = millionKmFromSun(closestAt(b.line, day));
    if (km !== f.km) {
      f.km = km;
      const text = km === b.record ? PARKER_JOURNEY.record : PARKER_JOURNEY.closer;
      journeyScreen.tip.text = text.replace("{km}", km);
    }

    const lineMaterial = line.material as LineBasicMaterial;
    lineMaterial.opacity = PARKER_JOURNEY.opacity * f.reveal;
    setHexIfChanged(lineMaterial.color, PARKER_JOURNEY.color);
    const dotMaterial = dots.material as PointsMaterial;
    dotMaterial.opacity = f.reveal;
    dotMaterial.size = PARKER_JOURNEY.dotPx * gl.getPixelRatio();
    setHexIfChanged(dotMaterial.color, PARKER_JOURNEY.color);
  }, ORBIT_PRIORITY);

  // Once the camera has moved: the tip's dot, and where the labels go.
  useFrame(() => {
    const f = now.current;
    const b = built.current;
    if (tipDot.visible) {
      scratch.subVectors(tipWorld, camera.position);
      const k = Math.max(1, PARKER_VIEW.drawDistance / scratch.length());
      tipDot.position.copy(camera.position).addScaledVector(scratch, k);
    }

    const readable = !!b && f.on && PARKER_JOURNEY.labels && f.reveal > 0.5;
    if (!readable) {
      if (!hidden.current) {
        hidden.current = true;
        journeyScreen.markers.forEach((m) => (m.shown = false));
        journeyScreen.tip.shown = false;
        journeyLabels.update?.();
      }
      return;
    }
    hidden.current = false;

    // The tip's label, riding it — until it meets the probe.
    const tipScreen = journeyScreen.tip;
    tipScreen.shown = false;
    if (!f.done) {
      const ahead = projectPointToViewport(tipWorld, camera, gl.domElement, scratch);
      tipScreen.x = scratch.x;
      tipScreen.y = scratch.y;
      const a = useParkerAnchor.getState();
      projectPointToViewport(probe.set(a.x, a.y, a.z), camera, gl.domElement, probe);
      tipScreen.shown = ahead && Math.hypot(scratch.x - probe.x, scratch.y - probe.y) > TIP_MEETS_PX;
    }

    // The launch and flyby labels, with the planets (in the Lab, until the zoom focuses
    // on the probe): one per spot the line has passed, naming every flyby passed there,
    // each waiting until the tip has moved on.
    const planets = useGalaxyScroll.getState().progress <= 0 && labFocus() < 0.5;
    // The Sun moved this frame; its group's matrices only catch up at render.
    if (planets) rotRef.current?.updateWorldMatrix(true, false);
    for (let i = 0; i < journeyScreen.markers.length; i++) {
      const screen = journeyScreen.markers[i];
      screen.shown = false;
      if (!planets || i >= f.reached || b.spots[i] !== i || !rotRef.current) continue;
      let here = 0;
      let passing = false;
      for (let k = i; k < f.reached; k++) {
        if (b.spots[k] !== i) continue;
        here |= 1 << k;
        if (!f.done && f.day - b.markerDays[k] < LABEL_AFTER_DAYS) passing = true;
      }
      if (passing) continue;
      screen.here = here;
      rotRef.current.localToWorld(scratch.copy(b.markers[i]));
      const ahead = projectPointToViewport(scratch, camera, gl.domElement, scratch);
      screen.x = scratch.x;
      screen.y = scratch.y;
      screen.shown = ahead;
    }
    journeyLabels.update?.();
  }, LABEL_PRIORITY);

  return (
    <>
      <primitive object={tipDot} />
      <group ref={sysRef}>
        <group ref={rotRef}>
          <primitive object={line} />
          <primitive object={tipLine} />
          <primitive object={dots} />
        </group>
      </group>
    </>
  );
};

export default ParkerJourney;
