import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { jumpToJourney } from "#/components/three.js/scene/devPanel";
import { PHASE_NAV, PHASE_STOPS } from "./config";

/**
 * The navigation assistant's section of the dev tuning panel (hosted by GalaxyGui): jump
 * to each resting point, the orb → button animation, and the glide's timing (applied on
 * the next press).
 */
export function buildPhaseNavPanel(gui: GUI) {
  const fJump = gui.addFolder("Jump to a rest (its button shows)");
  for (const stop of PHASE_STOPS) {
    if (!stop.window) continue;
    const [from, to] = stop.window;
    const go = { [stop.id]: () => jumpToJourney((from + to) / 2) };
    fJump.add(go, stop.id).name(stop.name);
  }

  const fAssist = gui.addFolder("The orb → button");
  fAssist
    .add(PHASE_NAV, "revealSeconds", 0.3, 2.5, 0.05)
    .name("grow / fold back (s)");
  fAssist
    .add(PHASE_NAV, "autoCloseSeconds", 2, 20, 0.5)
    .name("fold back if unused (s)");

  const fGlide = gui.addFolder("Glide");
  fGlide
    .add(PHASE_NAV, "secondsPerScreen", 0.2, 3, 0.1)
    .name("seconds per screen of scroll");
  fGlide.add(PHASE_NAV, "minSeconds", 0.5, 5, 0.1).name("shortest glide (s)");
  fGlide.add(PHASE_NAV, "maxSeconds", 2, 20, 0.5).name("longest glide (s)");
  fGlide
    .add(PHASE_NAV, "ease", [
      "none",
      "sine.inOut",
      "power1.inOut",
      "power2.inOut",
      "power3.inOut",
      "expo.inOut",
    ])
    .name("extra easing (none = each beat's own)");
}
