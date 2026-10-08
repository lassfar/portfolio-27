import type { StoryTimelineTuning } from "#/components/pages/home/timeline/StoryTimeline.types";
import { TIMELINE } from "#/components/pages/home/timeline/tuning";

/**
 * The calm book's timeline (P27-93): the journey's (TIMELINE), in the same place and shape,
 * tuned to read calmly and to meet WCAG.
 * - Its marks stand out from the page at 3:1 or more (1.4.11): the journey's warm grey, made
 *   lighter (4.9:1), and the chapters ahead shown in soft slate (3.5:1), not hidden.
 * - It doesn't dim while you read (that would drop them under 3:1), nor breathe (2.2.2).
 */
export const BOOK_TIMELINE: StoryTimelineTuning = {
  ...TIMELINE,
  color: "custom",
  customColor: "#8a8686",
  upcoming: "dim",
  upcomingAlpha: 0.45,
  glow: 0,
  pulse: false,
};
