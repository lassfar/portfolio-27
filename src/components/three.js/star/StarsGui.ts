import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { copyValues, jumpToJourney, jumpToVoyage } from "#/components/three.js/scene/devPanel";
import { STARFIELD } from "./config";

/** The code defaults, for "reset" (the panel mutates STARFIELD in place). */
const DEFAULTS = {
  twinkleSpeed: STARFIELD.twinkleSpeed,
  twinkleAmount: STARFIELD.twinkleAmount,
  sparkle: { ...STARFIELD.sparkle },
};

/** The tunable values, as JSON to bake into `star/config.ts`. */
function starsSnapshot(): string {
  return JSON.stringify(
    {
      twinkleSpeed: STARFIELD.twinkleSpeed,
      twinkleAmount: STARFIELD.twinkleAmount,
      sparkle: STARFIELD.sparkle,
    },
    null,
    2
  );
}

/**
 * The starfield's section of the dev tuning panel (hosted by GalaxyGui). Every value
 * applies instantly (the starfield reads them each frame); "copy values" puts the JSON
 * on the clipboard to bake into `star/config.ts`.
 */
export function buildStarsPanel(gui: GUI) {
  const refresh = () => gui.controllersRecursive().forEach((c) => c.updateDisplay());
  const S = STARFIELD.sparkle;

  const fJump = gui.addFolder("Jump to");
  const jumps = {
    hero: () => jumpToJourney(0),
    about: () => jumpToJourney(0.134),
    wide: () => jumpToVoyage(0.5),
    lab: () => jumpToJourney(0.611),
  };
  fJump.add(jumps, "hero").name("the hero");
  fJump.add(jumps, "about").name("About (the Saturn)");
  fJump.add(jumps, "wide").name("the solar system");
  fJump.add(jumps, "lab").name("the Lab");

  const fSpark = gui.addFolder("Sparkling stars");
  fSpark.add(S, "share", 0, 1, 0.01).name("how many (share of the bright ones)");
  fSpark.add(S, "size", 6, 80, 1).name("size — ray reach (px)");
  fSpark.add(S, "spikes", 0, 3, 0.05).name("ray strength");
  fSpark.add(S, "rayWidth", 0.2, 2, 0.05).name("ray thickness (px)");
  fSpark.add(S, "coreSize", 0.3, 3, 0.05).name("centre size (px)");
  fSpark.add(S, "halo", 0, 1, 0.01).name("glow around the centre");
  fSpark.add(S, "haloSize", 0.5, 10, 0.1).name("glow reach (px)");
  fSpark.add(S, "pulseSpeed", 0, 2, 0.01).name("pulse speed");
  fSpark.add(S, "pulseAmount", 0, 0.6, 0.01).name("pulse depth");

  const fField = gui.addFolder("All stars");
  fField.add(STARFIELD, "twinkleSpeed", 0, 3, 0.05).name("twinkle speed");
  fField.add(STARFIELD, "twinkleAmount", 0, 1, 0.01).name("twinkle depth");

  const fValues = gui.addFolder("Values");
  const actions = {
    copy: () => copyValues(copy, starsSnapshot(), "copy values", "StarsGui"),
    reset: () => {
      STARFIELD.twinkleSpeed = DEFAULTS.twinkleSpeed;
      STARFIELD.twinkleAmount = DEFAULTS.twinkleAmount;
      Object.assign(STARFIELD.sparkle, DEFAULTS.sparkle);
      refresh();
    },
  };
  const copy = fValues.add(actions, "copy").name("copy values");
  fValues.add(actions, "reset").name("reset to code defaults");

  fField.close();
}
