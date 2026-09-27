import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { jumpToJourney } from "#/components/three.js/scene/devPanel";
import { JOURNEY } from "#/components/three.js/star/config";
import { PARKER_FOCUS } from "./config";

/** Scroll to a point of the Lab (0 = leaving the Earth → 1 = at the Parker Solar Probe). */
function jumpToLab(lab: number) {
  jumpToJourney(JOURNEY.earthDwellEnd + lab * (JOURNEY.galaxyStart - JOURNEY.earthDwellEnd));
}

/**
 * The Parker Solar Probe's section of the dev tuning panel (hosted by GalaxyGui): what
 * fades as the Lab focuses on the probe (PARKER_FOCUS — applies instantly), and jumps to
 * each stretch of the trip (see PARKER_CAM).
 */
export function buildParkerPanel(gui: GUI) {
  const fJump = gui.addFolder("Jump to");
  const jumps = {
    leave: () => jumpToLab(0.15),
    overview: () => jumpToLab(0.3),
    zoom: () => jumpToLab(0.55),
    empty: () => jumpToLab(0.66),
    arrive: () => jumpToLab(0.8),
    closeUp: () => jumpToLab(0.97),
  };
  fJump.add(jumps, "leave").name("leaving the Earth");
  fJump.add(jumps, "overview").name("the overview");
  fJump.add(jumps, "zoom").name("zooming in");
  fJump.add(jumps, "empty").name("the empty stretch");
  fJump.add(jumps, "arrive").name("the arrival");
  fJump.add(jumps, "closeUp").name("the close-up");

  const fFocus = gui.addFolder("Focus on the probe (what fades)");
  fFocus.add(PARKER_FOCUS, "fadeSun").name("fade the Sun");
  fFocus.add(PARKER_FOCUS, "fadeSystem").name("fade the solar system");
}
