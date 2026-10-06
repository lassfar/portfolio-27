import { create } from "zustand";

/** Who started a glide of the journey (glideToJourney). */
export type GlideSource = "assistant" | "timeline" | "tour";

/**
 * The glide in progress, if any, and who started it (P27-79): the story's subtitles
 * can stay away while the navigation assistant glides the visitor along. Set by
 * glideToJourney; cleared as the glide ends, or as the visitor takes the scroll back.
 */
type GlideState = {
  by: GlideSource | null;
  setBy: (by: GlideSource | null) => void;
};

export const useGlide = create<GlideState>((set) => ({
  by: null,
  // The same value again (a wheel with no glide running) notifies no one.
  setBy: (by) => set((s) => (s.by === by ? s : { by })),
}));
