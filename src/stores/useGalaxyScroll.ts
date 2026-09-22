import { create } from "zustand";

/**
 * Galaxy-finale progress (0..1), published each frame by the one pinned journey
 * (see useCosmicJourney) and read by the R3F galaxy beat. It drives the camera
 * pull-back from the Voyager, the star-field fly-through, the galaxy's reveal,
 * and the "You are here" marker. Read with getState() inside useFrame — never
 * subscribed, so writing every frame triggers no React re-render.
 */
type GalaxyScrollState = {
  progress: number;
  setProgress: (progress: number) => void;
};

export const useGalaxyScroll = create<GalaxyScrollState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
