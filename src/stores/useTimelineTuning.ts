import { create } from "zustand";

/**
 * Bumped by the dev panel's story-timeline section (TimelineGui) after it edits TIMELINE
 * in place, so the timeline re-renders with the new values.
 */
type TimelineTuningState = {
  rev: number;
  bump: () => void;
};

export const useTimelineTuning = create<TimelineTuningState>((set) => ({
  rev: 0,
  bump: () => set((s) => ({ rev: s.rev + 1 })),
}));
