import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { GALAXY_ZOOM } from "#/components/three.js/galaxy/config";
import { journeyAtGalaxy } from "#/components/three.js/galaxy/pace";
import { copyValues, jumpToJourney, jumpToVoyage } from "#/components/three.js/scene/devPanel";
import { SOLAR, SUN, SUN_CORE, VOYAGE } from "./config";
import { rebuildSun, resetSunTuning, sunTuningSnapshot } from "./tuning";

/**
 * The Sun's section of the dev tuning panel (hosted by GalaxyGui). It mutates `SUN`,
 * `SUN_CORE` and `SOLAR.ring` in place: most values apply instantly (the Sun reads them
 * every frame); the ones marked "rebuilds" re-scatter the dots when you let go of the
 * slider. "copy values" puts the JSON on the clipboard to bake into `solar/config.ts`.
 */
export function buildSunPanel(gui: GUI) {
  const refresh = () => gui.controllersRecursive().forEach((c) => c.updateDisplay());

  const fJump = gui.addFolder("Jump to");
  const jumps = {
    appear: () => jumpToVoyage(0.25),
    wide: () => jumpToVoyage(VOYAGE.flyoutEnd),
    finale: () => jumpToJourney(journeyAtGalaxy(GALAXY_ZOOM.panSunEnd)),
  };
  fJump.add(jumps, "appear").name("the Sun fading in");
  fJump.add(jumps, "wide").name("the Sun, centred (voyage)");
  fJump.add(jumps, "finale").name("the solar system (finale)");
  fJump.add(SUN, "paused").name("pause the Sun");

  const fShell = gui.addFolder("Dotted surface");
  fShell.add(SUN, "radius", 1, 8, 0.05).name("radius").onFinishChange(rebuildSun);
  fShell.add(SUN, "count", 1000, 40000, 500).name("dots (rebuilds)").onFinishChange(rebuildSun);
  fShell.add(SUN, "countMobile", 1000, 40000, 500).name("dots on phones (rebuilds)").onFinishChange(rebuildSun);
  fShell.add(SUN, "dotSize", 10, 300, 1).name("dot size");
  fShell.add(SUN, "dotSoftness", 0.02, 0.5, 0.01).name("dot softness");
  fShell.add(SUN, "brightness", 0, 3, 0.05).name("brightness");
  fShell.add(SUN, "shellJitter", 0, 0.3, 0.005).name("grain depth (rebuilds)").onFinishChange(rebuildSun);
  fShell.add(SUN, "spin", 0, 0.5, 0.005).name("spin");
  fShell.add(SUN, "swirl", 0, 0.05, 0.001).name("drift along the surface");
  fShell.add(SUN, "shimmer", 0, 1, 0.01).name("shimmer");
  fShell.add(SUN, "shimmerSpeed", 0, 3, 0.05).name("shimmer speed");
  fShell.add(SUN, "backDim", 0, 1, 0.01).name("far side (through the gaps)");
  fShell.addColor(SUN, "core").name("centre colour");
  fShell.addColor(SUN, "mid").name("middle colour");
  fShell.addColor(SUN, "edge").name("edge colour");
  fShell.add(SUN, "gradientSplit", 0.05, 0.95, 0.01).name("middle colour at");

  const fCore = gui.addFolder("Glow inside (the original Sun)");
  fCore.add(SUN_CORE, "bodyStrength", 0, 3, 0.05).name("strength (0 = off)");
  fCore.add(SUN_CORE, "count", 0, 80000, 1000).name("dots (rebuilds)").onFinishChange(rebuildSun);
  fCore.add(SUN_CORE, "countMobile", 0, 80000, 1000).name("dots on phones (rebuilds)").onFinishChange(rebuildSun);
  fCore.add(SUN_CORE, "size", 5, 150, 1).name("dot size");
  fCore.add(SUN_CORE, "radiusScale", 0.3, 1.2, 0.01).name("size × radius (rebuilds)").onFinishChange(rebuildSun);
  fCore.add(SUN_CORE, "fill", 0.05, 1, 0.01).name("depth, 1 = solid (rebuilds)").onFinishChange(rebuildSun);
  fCore.addColor(SUN_CORE, "core").name("centre colour");
  fCore.addColor(SUN_CORE, "mid").name("middle colour");
  fCore.addColor(SUN_CORE, "edge").name("edge colour");
  fCore.add(SUN_CORE, "gradientSplit", 0.05, 0.95, 0.01).name("middle colour at");
  fCore.add(SUN_CORE, "granulation", 0, 8, 0.1).name("boil detail");
  fCore.add(SUN_CORE, "flowSpeed", 0, 1.5, 0.01).name("boil speed");
  fCore.add(SUN_CORE, "surfaceBoil", 0, 0.1, 0.001).name("surface dimples");
  fCore.add(SUN_CORE, "spin", 0, 0.5, 0.005).name("spin");

  const fCorona = gui.addFolder("Corona (living dots around it)");
  fCorona.add(SUN_CORE, "coronaStrength", 0, 3, 0.05).name("strength (0 = off)");
  fCorona.add(SUN_CORE, "coronaFraction", 0, 0.5, 0.01).name("share of the dots (rebuilds)").onFinishChange(rebuildSun);
  fCorona.add(SUN_CORE, "coronaReach", 0, 1.5, 0.01).name("reach × radius (rebuilds)").onFinishChange(rebuildSun);
  fCorona.add(SUN_CORE, "coronaDrift", 0, 0.8, 0.01).name("drift in / out");
  fCorona.add(SUN_CORE, "coronaFlicker", 0, 1, 0.01).name("flicker");
  fCorona.addColor(SUN_CORE, "corona").name("outer colour");

  const fHalo = gui.addFolder("Halo (soft outer glow)");
  fHalo.add(SUN_CORE, "haloStrength", 0, 3, 0.05).name("strength (0 = off)");
  fHalo.add(SUN_CORE, "glowSize", 0.5, 8, 0.05).name("size × radius");
  fHalo.addColor(SUN_CORE, "haloTint").name("tint (white = as is)");

  const fRings = gui.addFolder("Orbit lines");
  fRings.add(SOLAR.ring, "visible").name("show");
  fRings.addColor(SOLAR.ring, "color").name("colour");
  fRings.add(SOLAR.ring, "opacity", 0, 1, 0.01).name("opacity");

  const fValues = gui.addFolder("Values");
  const actions = {
    copy: () => copyValues(copy, sunTuningSnapshot(), "copy values", "SunGui"),
    reset: () => {
      resetSunTuning();
      refresh();
    },
  };
  const copy = fValues.add(actions, "copy").name("copy values");
  fValues.add(actions, "reset").name("reset to code defaults");

  // Keep it compact: the jumps + the dotted surface open, the rest one click away.
  [fCore, fCorona, fHalo, fRings].forEach((folder) => folder.close());
}
