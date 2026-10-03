import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { DAMPING } from "#/components/three.js/star/utils";
import { GALAXY_FLIGHT, STORY_MOTION, type StoryCurve } from "./storyMotion";

/**
 * The story motion's section of the dev tuning panel (hosted by GalaxyGui): the one
 * curve the standard moves follow, the flight to the Milky Way's own curve — applied
 * live on the next scroll (bake them into scene/storyMotion.ts) — and the frame rate
 * the easings were tuned at (bake it into star/utils.ts DAMPING).
 */
export function buildStoryMotionPanel(gui: GUI) {
  const curves: StoryCurve[] = ["cubic", "power2", "sine", "smoothstep"];
  gui
    .add(STORY_MOTION, "curve", curves)
    .name("in-out curve (cubic = cinematic)");
  const fGalaxy = gui.addFolder(
    "Flight to the Milky Way (slow → normal → very slow)",
  );
  fGalaxy.add(GALAXY_FLIGHT, "rise", 1, 4, 0.1).name("gentle start");
  fGalaxy.add(GALAXY_FLIGHT, "settle", 1, 8, 0.1).name("long slow finish");
  // The hero zoom, the stars' scroll turn, the drags, the pins' hover: the same speed on
  // every screen. Higher = quicker everywhere.
  gui.add(DAMPING, "referenceFps", 30, 144, 1).name("easing reference (FPS)");
}
