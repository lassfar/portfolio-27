"use client";

import { useEffect } from "react";
import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";

/**
 * Dev tuning panel — nine sections: the PERFORMANCE switches (scene/PerformanceGui.ts),
 * the STARS (star/StarsGui.ts), the SUN (solar/SunGui.ts), the PLANETS
 * (solar/PlanetGui.ts), the PARKER SOLAR PROBE (parker/ParkerGui.ts), the STORY TIMELINE
 * (pages/home/timeline/TimelineGui.ts), the GALAXY finale, the NAVIGATION ASSISTANT
 * (pages/home/phase-nav/PhaseNavGui.ts) and the STORY MOTION curve
 * (scene/StoryMotionGui.ts).
 *
 * The galaxy section is the same lil-gui panel (folders + labels)
 * as `docs/prototypes/galaxy-realistic.html` and `galaxy-zoom-realistic.html`, driving
 * the REAL scene live. It mutates `GALAXY` / `GALAXY_FX` in place: look values apply
 * instantly, shape values rebuild the galaxy, pose values re-place it (the Sun stays in
 * its arm). Plus "jump to" buttons (the finale is ~72% down the page), the scroll
 * timing windows, "copy values" (to bake them into config.ts) and "reset".
 *
 * Visibility: with `SHOW_GALAXY_GUI` on, it shows in development (`?gui=0` hides it);
 * in production it only ever shows with `?gui` in the URL, so visitors never see it.
 * With the switch off, it stays hidden unless you open the site with `?gui`.
 * lil-gui is the copy bundled with three.js, loaded on demand together with the sections
 * (GalaxyGuiPanel.ts) — they add nothing to the page otherwise.
 */

/** Master switch — on: the panel shows in dev. Set to `false` to hide it (`?gui` still opens it). */
const SHOW_GALAXY_GUI = false;

const GalaxyGui = () => {
  useEffect(() => {
    const gui = new URLSearchParams(window.location.search).get("gui");
    const askedFor = gui !== null && gui !== "0"; // ?gui opens it anywhere
    const devDefault = SHOW_GALAXY_GUI && process.env.NODE_ENV !== "production" && gui !== "0";
    if (!askedFor && !devDefault) return;

    let panel: GUI | null = null;
    let cancelled = false;
    Promise.all([
      import("three/examples/jsm/libs/lil-gui.module.min.js"),
      import("./GalaxyGuiPanel"),
    ]).then(([{ GUI }, { buildDevPanel }]) => {
      if (cancelled) return;
      panel = new GUI({ title: "Tuning (dev)", width: 310 });
      buildDevPanel(panel);
    });
    return () => {
      cancelled = true;
      panel?.destroy();
    };
  }, []);
  return null;
};

export default GalaxyGui;
