import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { useQuality } from "#/stores/useQuality";
import { QUALITY_STEPS } from "./quality";
import {
  loadSavedPerformance,
  notifyPerformance,
  PERFORMANCE,
  restorePerformanceDefaults,
  savePerformance,
} from "./performance";

/**
 * The "⚡ Performance" section (P27-78): one switch per performance fix, where "(old)" is
 * the look before the fix. Built only with `?gui`, so the switches saved in this browser
 * load only then; every change applies live and is saved.
 */
export function buildPerformancePanel(gui: GUI) {
  loadSavedPerformance();
  const apply = () => {
    savePerformance();
    notifyPerformance();
  };

  const steps = Object.fromEntries(QUALITY_STEPS.map((s, i) => [`${i} ${s.name}`, i]));
  gui
    .add(PERFORMANCE, "quality", { auto: "auto", ...steps })
    .name("quality (tiers)")
    .onChange(apply);
  // Read-only: the step the scene is at now.
  const now = {
    get step() {
      const step = useQuality.getState().step;
      return `${step} ${QUALITY_STEPS[step].name}`;
    },
  };
  gui.add(now, "step").name("↳ now").disable().listen();
  gui
    .add(PERFORMANCE, "msaa", { "8× (old)": 8, "4×": 4, "2×": 2, off: 0 })
    .name("multisampling")
    .onChange(apply);
  gui.add(PERFORMANCE, "pauseCovered").name("pause while covered").onChange(apply);
  gui
    .add(PERFORMANCE, "blurQuality", { "heavy (old)": "heavy", light: "light" })
    .name("blur quality (Contact, About)")
    .onChange(apply);
  gui
    .add(PERFORMANCE, "aboutBlur", { "CSS (old)": "css", "3D": "3d" })
    .name("blur behind About")
    .onChange(apply);
  gui.add(PERFORMANCE, "hideInvisible").name("hide invisible objects").onChange(apply);
  gui.add(PERFORMANCE, "planetDotLimit").name("planet dot limit").onChange(apply);
  gui.add(PERFORMANCE, "saturnLod").name("Saturn LOD").onChange(apply);

  const actions = {
    restore: () => {
      restorePerformanceDefaults();
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    },
  };
  gui.add(actions, "restore").name("restore defaults");
}
