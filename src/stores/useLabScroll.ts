import { create } from "zustand";

/**
 * The Lab (Voyager) beat's scroll progress — the story beat appended AFTER the
 * Earth arrival. 0 = the Earth is still the focus (the Lab hasn't begun); 1 =
 * fully arrived at the Voyager.
 *
 * Driven by the same one master pinned ScrollTrigger (useCosmicJourney) as a
 * fraction of the pin PAST `JOURNEY.voyageEnd`, so the whole story stays on one
 * pin. Read with getState() inside useFrame — never subscribed, so writing every
 * frame triggers no React re-render.
 */
type LabScrollState = {
  progress: number;
  setProgress: (progress: number) => void;
};

export const useLabScroll = create<LabScrollState>((set) => ({
  progress: 0,
  setProgress: (progress) => set({ progress }),
}));
