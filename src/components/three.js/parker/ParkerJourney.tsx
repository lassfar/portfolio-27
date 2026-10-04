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
import { useSceneRotation } from "#/stores/useSceneRotation";
import { PARKER_JOURNEY } from "./config";
import { buildJourney, journeyPoint, pointsUpTo, type JourneyData, type JourneyLine } from "./journey";
import { journeyLabels, journeyScreen } from "./journeyScreen";
import { julianNow } from "./orbit";

const DATA_URL = "/data/parker-journey.json";
/** At the latest this long after load, the recorded path starts loading anyway (ms). */
const LOAD_IDLE_TIMEOUT_MS = 3000;
/** …or as soon as the journey gets this close to the Lab (a jump right after load). */
const LOAD_AHEAD_MP = 0.1;
/** Markers closer than this (scene units) share a spot, and a label. */
const SAME_SPOT = 0.1;

type Built = {
  line: JourneyLine;
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
 * tighter loops, to the live probe today — a thin line drawn as the Lab pulls back to
 * the inner solar system, with dots + labels at the launch and the flybys.
 *
 * It lies on the planets' orbit lines (same frame, same distance compression; it moves
 * with the Sun and the scene's drag, like them), draws itself in step with the system
 * fading back in, complete at the overview, then fades as the zoom focuses on the probe.
 * The path loads in idle time and is built by the scene's build queue.
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
        new LineBasicMaterial({ color: PARKER_JOURNEY.color, transparent: true, opacity: 0, depthWrite: false }),
      ),
    [],
  );
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
  useEffect(
    () => () => {
      line.geometry.dispose();
      (line.material as LineBasicMaterial).dispose();
      dots.geometry.dispose();
      const m = dots.material as PointsMaterial;
      m.map?.dispose();
      m.dispose();
    },
    [line, dots],
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
              built.current = {
                line: result.line,
                geometry,
                markers,
                markerDays: [0, ...data.flybys.map((f) => f.day)],
                spots: markers.map((m, i) => markers.findIndex((o) => o.distanceTo(m) < SAME_SPOT)),
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

  // On the orbit lines' frame: centred on the (flying) Sun, turned with the scene's drag.
  useFrame(() => {
    if (rotRef.current) {
      const r = useSceneRotation.getState();
      rotRef.current.rotation.set(r.pitch, r.yaw, 0);
    }
    if (sysRef.current) {
      const sun = flyingSunPos();
      sysRef.current.position.set(sun[0], sun[1], sun[2]);
    }
  }, ORBIT_PRIORITY);

  // Once the camera has moved: how much is drawn, how visible, and where the labels go.
  const scratch = useMemo(() => new Vector3(), []);
  const hidden = useRef(true);
  useFrame(() => {
    const lab = clamp01(useLabScroll.getState().progress);
    const inLab = lab > 0 && useGalaxyScroll.getState().progress <= 0;
    // In with the solar system as the Lab leaves the Earth, out as the zoom focuses.
    const reveal = inLab
      ? easeOutCubic(remap01(lab, SOLAR.labReturn[0], SOLAR.labReturn[1])) * (1 - labFocus())
      : 0;
    const b = built.current;
    const visible = !!b && reveal > 0.001;
    line.visible = visible;
    dots.visible = visible;
    if (!b || !visible) {
      if (!hidden.current) {
        hidden.current = true;
        journeyScreen.markers.forEach((m) => (m.shown = false));
        journeyScreen.today = false;
        journeyLabels.update?.();
      }
      return;
    }
    hidden.current = false;

    // Drawn from the launch to today, in step with the system coming back.
    const draw = storyEase(remap01(lab, PARKER_JOURNEY.draw[0], PARKER_JOURNEY.draw[1]));
    const day = draw * b.line.today;
    b.geometry.setDrawRange(0, pointsUpTo(b.line, day));
    const lineMaterial = line.material as LineBasicMaterial;
    lineMaterial.opacity = PARKER_JOURNEY.opacity * reveal;
    setHexIfChanged(lineMaterial.color, PARKER_JOURNEY.color);
    const dotMaterial = dots.material as PointsMaterial;
    dotMaterial.opacity = reveal;
    dotMaterial.size = PARKER_JOURNEY.dotPx * gl.getPixelRatio();
    setHexIfChanged(dotMaterial.color, PARKER_JOURNEY.color);
    let reached = 0;
    while (reached < b.markerDays.length && b.markerDays[reached] <= day) reached++;
    dots.geometry.setDrawRange(0, reached);

    // The labels: one per spot the line has reached, while it's readable — naming
    // every flyby reached there.
    const readable = PARKER_JOURNEY.labels && reveal > 0.5;
    // The Sun moved this frame; its group's matrices only catch up at render.
    if (readable) rotRef.current?.updateWorldMatrix(true, false);
    for (let i = 0; i < journeyScreen.markers.length; i++) {
      const screen = journeyScreen.markers[i];
      screen.shown = false;
      if (!readable || i >= reached || b.spots[i] !== i || !rotRef.current) continue;
      screen.here = 0;
      for (let k = i; k < reached; k++) if (b.spots[k] === i) screen.here |= 1 << k;
      rotRef.current.localToWorld(scratch.copy(b.markers[i]));
      const ahead = projectPointToViewport(scratch, camera, gl.domElement, scratch);
      screen.x = scratch.x;
      screen.y = scratch.y;
      screen.shown = ahead;
    }
    journeyScreen.today = readable && draw >= 0.999;
    journeyLabels.update?.();
  }, LABEL_PRIORITY);

  return (
    <group ref={sysRef}>
      <group ref={rotRef}>
        <primitive object={line} />
        <primitive object={dots} />
      </group>
    </group>
  );
};

export default ParkerJourney;
