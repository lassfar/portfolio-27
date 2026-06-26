import { create } from "zustand";

/**
 * Bridges the Hero's pinned scroll progress (driven by GSAP ScrollTrigger on
 * the DOM) to the R3F scene (read inside useFrame). 0 = top of the hero,
 * 1 = end of the pinned zoom sequence.
 */
type HeroScrollState = {
  progress: number;
  setProgress: (progress: number) => void;
};

export const useHeroScroll = create<HeroScrollState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
