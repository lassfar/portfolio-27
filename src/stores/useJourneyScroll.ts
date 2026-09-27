import { create } from "zustand";

/**
 * The whole story's scroll progress: the master progress (mp, 0..1) of the one pinned
 * journey, published each frame by useCosmicJourney. Read by the story timeline, which
 * SUBSCRIBES outside React (useJourneyScroll.subscribe) and updates the DOM directly —
 * so writing every frame triggers no React re-render.
 */
type JourneyScrollState = {
  progress: number;
  setProgress: (progress: number) => void;
};

export const useJourneyScroll = create<JourneyScrollState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
