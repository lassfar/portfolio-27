"use client";

import { useEffect } from "react";
import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { copyValues, jumpToJourney } from "#/components/three.js/scene/devPanel";
import { buildPlanetPanel } from "#/components/three.js/solar/PlanetGui";
import { buildSunPanel } from "#/components/three.js/solar/SunGui";
import { GALAXY, GALAXY_FX, GALAXY_SPACE, updateGalaxyPlacement } from "./config";
import { journeyAtGalaxy } from "./pace";
import { galaxyTuningSnapshot, rebuildGalaxy, resetGalaxyTuning } from "./tuning";

/**
 * Dev tuning panel — three sections: the SUN (solar/SunGui.ts), the PLANETS
 * (solar/PlanetGui.ts) and the GALAXY finale.
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
 * lil-gui is the copy bundled with three.js, loaded on demand — it adds nothing to the
 * page otherwise.
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
    import("three/examples/jsm/libs/lil-gui.module.min.js").then(({ GUI }) => {
      if (cancelled) return;
      panel = new GUI({ title: "Tuning (dev)", width: 310 });
      const sun = panel.addFolder("☀ Sun");
      buildSunPanel(sun);
      buildPlanetPanel(panel.addFolder("● Planets"));
      const galaxy = panel.addFolder("✦ Galaxy finale");
      buildPanel(galaxy);
      // One section open at a time keeps the panel short.
      sun.close();
      galaxy.close();
    });
    return () => {
      cancelled = true;
      panel?.destroy();
    };
  }, []);
  return null;
};

export default GalaxyGui;

/** Scroll to a point of the galaxy finale (0 = leaving the Voyager, 1 = full galaxy). */
function jumpToGalaxy(progress: number) {
  jumpToJourney(journeyAtGalaxy(progress));
}

function buildPanel(gui: GUI) {
  const G = GALAXY;
  const FX = GALAXY_FX;
  const SP = GALAXY_FX.sparkles;
  const SPACE = GALAXY_SPACE;
  const place = () => updateGalaxyPlacement();
  const refresh = () => gui.controllersRecursive().forEach((c) => c.updateDisplay());

  const fJump = gui.addFolder("Jump to");
  const jumps = {
    voyager: () => jumpToGalaxy(0),
    solar: () => jumpToGalaxy(0.44),
    inside: () => jumpToGalaxy(0.68),
    galaxy: () => jumpToGalaxy(1),
    contact: () => jumpToJourney(1),
  };
  fJump.add(jumps, "voyager").name("leaving the Voyager (0%)");
  fJump.add(jumps, "solar").name("the solar system (44%)");
  fJump.add(jumps, "inside").name("inside the galaxy (68%)");
  fJump.add(jumps, "galaxy").name("the full galaxy (100%)");
  fJump.add(jumps, "contact").name("the contact form");

  const fCmp = gui.addFolder("Compare (switch layers on/off)");
  fCmp.add(FX, "showGlow").name("soft glow");
  fCmp.add(FX, "showDust").name("dust lanes");
  fCmp.add(FX, "showBloom").name("bloom");
  fCmp.add(FX, "showSparkles").name("sparkly stars");

  const fLook = gui.addFolder("Look");
  fLook.add(G, "glowAmount", 0, 0.6, 0.005).name("glow amount");
  fLook.add(G, "glowSize", 80, 500, 5).name("glow size");
  fLook.add(G, "dustOpacity", 0, 1, 0.01).name("dust darkness");
  fLook.add(G, "dustSize", 20, 300, 1).name("dust puff size");
  fLook.add(G, "knotBrightness", 0, 2.5, 0.05).name("pink regions");
  fLook.add(G, "coreOpacity", 0, 1.2, 0.02).name("core glow");
  fLook.add(G, "coreScale", 1, 6, 0.1).name("core size");
  fLook.add(FX, "bloomStrength", 0, 2.5, 0.05).name("bloom strength");
  fLook.add(FX, "bloomRadius", 0, 1, 0.01).name("bloom radius");
  fLook.add(FX, "bloomThreshold", 0, 1, 0.01).name("bloom threshold");
  fLook.add(FX, "highlightKnee", 0.3, 0.95, 0.01).name("highlight softness");
  fLook.add(G, "uSize", 0.3, 4, 0.05).name("dot size (px)");
  fLook.add(G, "twinkleAmount", 0, 0.6, 0.01).name("twinkle");
  fLook.add(G, "flightBoost", 0, 2, 0.05).name("dots brighter in flight");
  fLook.add(G, "coreFlightBoost", 0, 1.5, 0.05).name("core brighter in flight");

  const fNear = gui.addFolder("Inside view (glow + dust up close)");
  fNear.add(G, "nearFadeStart", 0, 12, 0.1).name("hidden closer than");
  fNear.add(G, "nearFadeEnd", 0.5, 20, 0.1).name("full beyond");

  const fSpark = gui.addFolder("Sparkly stars");
  fSpark.add(SP, "count", 0, 32, 1).name("count");
  fSpark.add(SP, "size", 20, 140, 1).name("size");
  fSpark.add(SP, "spikes", 0, 1.5, 0.05).name("sparkle");

  const fSpace = gui.addFolder("Space around it");
  fSpace.add(SPACE, "showStars").name("far stars");
  fSpace.add(SPACE, "starBrightness", 0, 3, 0.05).name("far stars brightness");
  fSpace.add(SPACE, "starSize", 0.5, 3, 0.05).name("far stars size (px)");
  fSpace.add(SPACE, "starCount", 0, 40000, 1000).name("far stars count").onFinishChange(rebuildGalaxy);
  fSpace.add(SPACE, "showGalaxies").name("distant galaxies");
  fSpace.add(SPACE, "galaxyBrightness", 0, 3, 0.05).name("distant galaxies brightness");
  fSpace.add(SPACE, "galaxySize", 0.3, 3, 0.05).name("distant galaxies size");
  fSpace.add(SPACE, "dragTurns").name("drag turns the galaxy");
  fSpace.add(G, "edgeSoftness", 0, 1, 0.01).name("soft edges");
  fSpace.add(G, "envelope", 0, 3, 0.05).name("outer glow").onFinishChange(rebuildGalaxy);
  fSpace.add(G, "outerStars", 0, 0.15, 0.005).name("outer stars").onFinishChange(rebuildGalaxy);

  const fPose = gui.addFolder("Pose & motion");
  fPose.add(G, "inclination", 0, 90, 1).onChange(place);
  fPose.add(G, "roll", -90, 90, 1).onChange(place);
  fPose.add(G, "frameCentering", 0, 1, 0.05).name("centre the galaxy");
  fPose.add(G, "revealOrbit", -270, 270, 5).name("circle around on reveal (°)");
  fPose.add(G, "revealOrbitLate", 1, 4, 0.1).name("…saved for the end");
  fPose.add(G, "spinSpeed", 0, 0.3, 0.005).name("spin speed");
  fPose.add(G, "differential", 0, 0.012, 0.001);
  fPose.add(G, "paused");

  const fShape = gui.addFolder("Shape (rebuilds)");
  fShape.add(G, "count", 10000, 150000, 5000).onFinishChange(rebuildGalaxy);
  fShape.add(G, "armCount", 1, 5, 1).onFinishChange(rebuildGalaxy);
  fShape.add(G, "pitchDeg", 8, 35, 1).name("armTightness").onFinishChange(rebuildGalaxy);
  fShape.add(G, "armWidth", 0.4, 2, 0.05).onFinishChange(rebuildGalaxy);
  fShape.add(G, "clumpiness", 0, 1, 0.05).name("knotty arms").onFinishChange(rebuildGalaxy);
  fShape.add(G, "interArmDim", 0.1, 1, 0.05).name("between-arm brightness").onFinishChange(rebuildGalaxy);
  fShape.add(G, "tBlue", 0.25, 0.75, 0.01).name("blue/peach balance").onFinishChange(rebuildGalaxy);
  fShape.add(G, "bulgeRadius", 0.8, 3.5, 0.1).onFinishChange(rebuildGalaxy);
  fShape
    .add(G, "discRadius", 6, 14, 0.5)
    .name("Rmax")
    .onFinishChange(() => {
      place(); // the Sun's arm radius follows the disc size
      rebuildGalaxy();
    });
  fShape.add(G, "hiiCount", 0, 400, 10).name("pink regions count").onFinishChange(rebuildGalaxy);
  fShape.add(G, "dustOffset", 0, 0.8, 0.01).name("dust lane offset").onFinishChange(rebuildGalaxy);
  fShape.add(G, "dustBreak", 0, 0.8, 0.01).name("dust gaps").onFinishChange(rebuildGalaxy);
  fShape.add(G, "featherRate", 0, 0.2, 0.005).name("dust feathers").onFinishChange(rebuildGalaxy);
  fShape.add(G, "seed", 1, 9999, 1).onFinishChange(rebuildGalaxy);
  fShape
    .add(
      {
        regenerate: () => {
          G.seed = Math.floor(Math.random() * 9999) + 1;
          refresh();
          rebuildGalaxy();
        },
      },
      "regenerate"
    );

  const fTime = gui.addFolder("Scroll timing (0 = Voyager → 1 = full galaxy)");
  fTime.add(G, "revealStart", 0, 1, 0.01).name("galaxy fades in from");
  fTime.add(G, "revealEnd", 0, 1, 0.01).name("…fully visible at");
  fTime.add(G.coreGlowIn, "0", 0, 1, 0.01).name("core glow from");
  fTime.add(G.coreGlowIn, "1", 0, 1, 0.01).name("…full at");
  fTime.add(FX.fxIn, "0", 0, 1, 0.01).name("soft highlights from");
  fTime.add(FX.fxIn, "1", 0, 1, 0.01).name("…full at");
  fTime.add(SP.fadeIn, "0", 0, 1, 0.01).name("sparkles from");
  fTime.add(SP.fadeIn, "1", 0, 1, 0.01).name("…full at");
  fTime.add(G.flightBoostIn, "0", 0, 1, 0.01).name("flight boost from");
  fTime.add(G.flightBoostIn, "1", 0, 1, 0.01).name("…full at");
  fTime.add(G.flightBoostOut, "0", 0, 1, 0.01).name("…easing off from");
  fTime.add(G.flightBoostOut, "1", 0, 1, 0.01).name("…gone at");
  fTime.add(SPACE.starsIn, "0", 0, 1, 0.01).name("far stars from");
  fTime.add(SPACE.starsIn, "1", 0, 1, 0.01).name("…full at");
  fTime.add(SPACE.galaxiesIn, "0", 0, 1, 0.01).name("distant galaxies from");
  fTime.add(SPACE.galaxiesIn, "1", 0, 1, 0.01).name("…full at");

  const fValues = gui.addFolder("Values");
  const actions = {
    copy: () => copyValues(copy, galaxyTuningSnapshot(), "copy values", "GalaxyGui"),
    reset: () => {
      resetGalaxyTuning();
      refresh();
    },
  };
  const copy = fValues.add(actions, "copy").name("copy values");
  fValues.add(actions, "reset").name("reset to code defaults");

  // Keep the panel compact: the everyday folders open, the rest closed.
  [fNear, fSpark, fSpace, fPose, fShape, fTime].forEach((folder) => folder.close());
}
