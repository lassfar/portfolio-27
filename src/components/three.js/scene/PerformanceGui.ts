import type { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
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

  gui
    .add(PERFORMANCE, "msaa", { "8× (old)": 8, "4×": 4, "2×": 2, off: 0 })
    .name("multisampling")
    .onChange(apply);
  gui.add(PERFORMANCE, "pauseCovered").name("pause while covered").onChange(apply);

  const actions = {
    restore: () => {
      restorePerformanceDefaults();
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    },
  };
  gui.add(actions, "restore").name("restore defaults");
}
