import { create } from "zustand";

/**
 * Bridges the About section's pinned scroll progress (driven by GSAP
 * ScrollTrigger on the DOM) to the R3F planet scene (read inside useFrame).
 * 0 = particles dispersed across space, 1 = fully assembled into Saturn.
 */
type AboutScrollState = {
  progress: number;
  setProgress: (progress: number) => void;
};

export const useAboutScroll = create<AboutScrollState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
