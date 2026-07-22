import { create } from "zustand";

/**
 * Bridges the post-About "voyage" scroll progress (driven by the same master
 * pinned ScrollTrigger on the DOM) to the R3F scene (read inside useFrame).
 *
 * 0 = the Saturn rests in place, fully built (the voyage hasn't begun);
 * 1 = the end of the voyage.
 *
 * Sub-phases live in config (currently `FLYAWAY`, where the Saturn recedes and
 * thins to dust; the solar-system reveal and the approach to Earth extend the
 * later range in following milestones). Read with getState() inside useFrame —
 * never subscribed, so writing every frame triggers no React re-render.
 */
type VoyageScrollState = {
  progress: number;
  setProgress: (progress: number) => void;
};

export const useVoyageScroll = create<VoyageScrollState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
