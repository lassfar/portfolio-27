import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { goTo } from "#/components/pages/home/scroll/goTo";
import { PHASE_NAV, PHASE_STOPS } from "./config";

/**
 * The navigation assistant's section of the dev tuning panel (hosted by GalaxyGui): jump
 * to each resting point, the orb → button animation, how it gets out of the way during a
 * glide, and the glide's timing (applied on the next press).
 */
export function buildPhaseNavPanel(gui: GUI) {
  const fJump = gui.addFolder("Jump to a rest (its button shows)");
  for (const stop of PHASE_STOPS) {
    if (!stop.window) continue;
    const go = { [stop.id]: () => goTo(stop.id, { instant: true }) };
    fJump.add(go, stop.id).name(stop.name);
  }

  const fAssist = gui.addFolder("The orb → button");
  fAssist
    .add(PHASE_NAV, "revealSeconds", 0.3, 2.5, 0.05)
    .name("grow / fold back (s)");
  fAssist
    .add(PHASE_NAV, "hoverOpenDelay", 0, 1, 0.02)
    .name("mouse: open after (s)");
  fAssist
    .add(PHASE_NAV, "hoverCloseDelay", 0, 5, 0.1)
    .name("mouse: fold back after leaving (s)");
  fAssist
    .add(PHASE_NAV, "autoCloseSeconds", 2, 20, 0.5)
    .name("fold back if unused (s)");

  const fHide = gui.addFolder("Hidden while gliding");
  fHide.add(PHASE_NAV, "hideSeconds", 0.2, 1.5, 0.05).name("shrink + drop / rise (s)");
  fHide.add(PHASE_NAV, "hideScale", 0.05, 1, 0.05).name("shrinks to (scale)");
  fHide.add(PHASE_NAV, "hideDrop", 0, 200, 4).name("drops (px)");

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
