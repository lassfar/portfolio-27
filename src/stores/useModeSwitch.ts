import { create } from "zustand";
import type { ChapterId } from "#/components/pages/home/story/story.types";
import type { MotionChoice } from "./motionPreference";

/** The transition screen, while a switch runs (motion/ModeVeil). */
export type SwitchVeil = {
  /** The mode it switches to. */
  to: MotionChoice;
  /** Where the visitor lands. */
  place: ChapterId;
  /** Shown, or fading out. */
  shown: boolean;
  /** The 3D is taking its time. */
  slow: boolean;
};

type ModeSwitchState = {
  /** The mode on screen once a switch has changed it; null, the one the page loaded in. */
  shown: MotionChoice | null;
  /** The transition screen, while a switch runs and as it fades out. */
  veil: SwitchVeil | null;
  /** The switch's status line, for screen readers ("Reduce motion on: The Earth"). */
  status: string;
};

/**
 * The live switch between the modes (P27-94): which one is on screen, the transition screen
 * and the status line. Driven by motion/modeSwitch; ModeGate renders from it.
 */
export const useModeSwitch = create<ModeSwitchState>(() => ({
  shown: null,
  veil: null,
  status: "",
}));
