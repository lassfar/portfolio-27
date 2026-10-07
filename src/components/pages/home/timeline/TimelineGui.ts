import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { copyValues } from "#/components/three.js/scene/devPanel";
import { useTimelineTuning } from "#/stores/useTimelineTuning";
import { TIMELINE } from "./config";
import type { StoryTimelineColor, StoryTimelineShape } from "./StoryTimeline.types";

/** The code defaults, for "reset" (the panel edits TIMELINE in place). */
const DEFAULTS = { ...TIMELINE };

/** The tunable values, as JSON to bake into `timeline/config.ts` (TIMELINE). */
function timelineSnapshot(): string {
  return JSON.stringify(TIMELINE, null, 2);
}

/**
 * The story timeline's section of the dev tuning panel (hosted by GalaxyGui). Every
 * value applies instantly (TIMELINE is edited in place, then the timeline re-renders);
 * "copy values" puts the JSON on the clipboard to bake into `timeline/config.ts`.
 */
export function buildTimelinePanel(gui: GUI) {
  const T = TIMELINE;
  const apply = () => useTimelineTuning.getState().bump();
  const refresh = () => gui.controllersRecursive().forEach((c) => c.updateDisplay());

  const fLayout = gui.addFolder("Layout");
  fLayout
    .add(T, "position", [
      "top left",
      "top center",
      "top right",
      "center left",
      "center right",
      "bottom left",
      "bottom center",
      "bottom right",
    ])
    .name("position")
    .onChange(apply);
  fLayout
    .add(T, "orientation", ["auto", "vertical", "horizontal"])
    .name("direction")
    .onChange(apply);
  fLayout.add(T, "edge", 0, 80, 0.5).name("from the edge (px, 0 = flush)").onChange(apply);
  fLayout.add(T, "railLength", 10, 100, 1).name("rail length (% of screen)").onChange(apply);
  fLayout.add(T, "railWidth", 0.1, 4, 0.1).name("rail thickness (px)").onChange(apply);
  fLayout.add(T, "minGap", 0, 60, 1).name("min gap between stars (px)").onChange(apply);

  const fColors = gui.addFolder("Colours (design system or custom)");
  const colors: StoryTimelineColor[] = [
    "peach",
    "dark-peach",
    "light-peach",
    "baby-blue",
    "light-baby-blue",
    "gray-slate",
    "dark",
    "rich-black",
    "custom",
  ];
  fColors.add(T, "color", colors).name("accent: fill + stars").onChange(apply);
  fColors.addColor(T, "customColor").name("↳ custom accent").onChange(apply);
  fColors.add(T, "railColor", colors).name("rail + upcoming stars").onChange(apply);
  fColors.addColor(T, "customRailColor").name("↳ custom rail").onChange(apply);
  fColors.add(T, "tipColor", colors).name("tooltip text").onChange(apply);
  fColors.addColor(T, "customTipColor").name("↳ custom tooltip").onChange(apply);

  const fStars = gui.addFolder("Stars");
  const shapes: StoryTimelineShape[] = ["star", "circle", "diamond", "tick", "orbit", "capsule"];
  fStars.add(T, "shape", shapes).name("shape").onChange(apply);
  fStars.add(T, "upcoming", ["dim", "hollow"]).name("upcoming marks").onChange(apply);
  fStars.add(T, "starSize", 2, 12, 0.5).name("star size (px)").onChange(apply);
  fStars.add(T, "currentSize", 3, 18, 0.5).name("current star (px)").onChange(apply);
  fStars.add(T, "glow", 0, 1, 0.05).name("glow").onChange(apply);
  fStars.add(T, "pulse").name("slow glow pulse").onChange(apply);
  fStars.add(T, "railAlpha", 0, 0.6, 0.01).name("unfilled rail strength").onChange(apply);
  fStars.add(T, "upcomingAlpha", 0, 1, 0.01).name("upcoming stars strength").onChange(apply);

  const fBehave = gui.addFolder("Behaviour");
  fBehave.add(T, "showAfter", 0, 400, 1).name("show after (scroll %)").onChange(apply);
  fBehave.add(T, "dimAfter", 0.2, 8, 0.1).name("dim after idle (s)").onChange(apply);
  fBehave.add(T, "dimOpacity", 0.05, 1, 0.01).name("dimmed strength").onChange(apply);
  fBehave.add(T, "hideAfter", 0, 8, 0.1).name("then hide after (s, 0 = never)").onChange(apply);
  fBehave.add(T, "glideSeconds", 0, 4, 0.1).name("glide duration (s)");
  fBehave.add(T, "nameOnChange").name("name on change (desktop)");
  fBehave.add(T, "nameSeconds", 0.5, 5, 0.1).name("name shows for (s)");

  const fValues = gui.addFolder("Values");
  const actions = {
    copy: () => copyValues(copy, timelineSnapshot(), "copy values", "TimelineGui"),
    reset: () => {
      Object.assign(TIMELINE, DEFAULTS);
      refresh();
      apply();
    },
  };
  const copy = fValues.add(actions, "copy").name("copy values");
  fValues.add(actions, "reset").name("reset to code defaults");
}
