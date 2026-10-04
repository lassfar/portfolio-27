import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { jumpToJourney } from "#/components/three.js/scene/devPanel";
import { JOURNEY, labAt } from "#/components/three.js/star/config";
import { LAB } from "#/components/three.js/voyager/config";
import { PARKER_FOCUS, PARKER_JOURNEY } from "./config";

/** Scroll to a point of the Lab (0 = leaving the Earth → 1 = at the Parker Solar Probe). */
function jumpToLab(lab: number) {
  jumpToJourney(JOURNEY.earthDwellEnd + lab * (JOURNEY.galaxyStart - JOURNEY.earthDwellEnd));
}

/**
 * The Parker Solar Probe's section of the dev tuning panel (hosted by GalaxyGui): what
 * fades as the Lab focuses on the probe (PARKER_FOCUS — applies instantly), its journey
 * line (PARKER_JOURNEY — live), and jumps to each stretch of the trip (see PARKER_CAM).
 */
export function buildParkerPanel(gui: GUI) {
  const fJump = gui.addFolder("Jump to");
  const jumps = {
    // Scroll % into the Lab (labAt), so they stay on their beats whatever its pause.
    leave: () => jumpToLab(labAt(210)),
    overview: () => jumpToLab(labAt(420)),
    zoom: () => jumpToLab(labAt(770)),
    empty: () => jumpToLab(labAt(924)),
    arrive: () => jumpToLab(labAt(1120)),
    closeUp: () => jumpToLab((LAB.recordLabelAt + 1) / 2), // the middle of the close-up's pause
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

  const fLine = gui.addFolder("Journey line");
  fLine.addColor(PARKER_JOURNEY, "color").name("colour");
  fLine.add(PARKER_JOURNEY, "opacity", 0, 1, 0.01).name("line opacity");
  fLine.add(PARKER_JOURNEY, "dotPx", 1, 14, 0.5).name("dot size (px)");
  fLine.add(PARKER_JOURNEY, "labels").name("labels");
}
