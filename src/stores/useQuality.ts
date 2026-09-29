import { create } from "zustand";

/**
 * The scene's quality step (0 = full quality; see scene/quality's QUALITY_STEPS), set
 * by the QualityMonitor from the measured FPS (P27-78). Read by the Canvas (its pixel
 * ratio), the composer (multisampling) and the galaxy (its glow).
 */
type QualityState = {
  step: number;
  setStep: (step: number) => void;
};

export const useQuality = create<QualityState>((set) => ({
  step: 0,
  setStep: (step) => set({ step }),
}));
