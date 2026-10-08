import type { StoryTimelineTuning } from "#/components/pages/home/timeline/StoryTimeline.types";
import { TIMELINE } from "#/components/pages/home/timeline/tuning";

/**
 * The calm book's timeline (P27-93): the journey's (TIMELINE), its look and place, meeting
 * WCAG the same way (P27-97); calm, it doesn't breathe (2.2.2).
 */
export const BOOK_TIMELINE: StoryTimelineTuning = { ...TIMELINE, pulse: false };
