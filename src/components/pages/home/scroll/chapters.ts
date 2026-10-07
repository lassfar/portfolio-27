import { PHASE_STOPS } from "#/components/pages/home/phase-nav/config";
import type { ChapterId } from "#/components/pages/home/story/story.types";
import { STORY_CHAPTERS } from "#/components/pages/home/timeline/config";
import { chapterAt } from "#/components/pages/home/timeline/layout";

/** A chapter's place on the pinned journey (master progress, 0..1). */
export type ChapterPlace = {
  start: number;
  /** Where the next chapter starts (1 for the last). */
  end: number;
  /** Where a visit to it lands: its resting view. */
  rest: number;
};

/**
 * The story's chapters on the pinned journey (P27-91): where each one starts, ends and
 * rests. The rests are the assistant's stops (Saturn built, the constellation assembled,
 * the Earth up close, the probe's close-up…), and the hero for Origin. Every chapter
 * navigation goes through it (goTo), as will the switch between the journey and the calm book.
 */
export const CHAPTER_MAP = Object.fromEntries(
  STORY_CHAPTERS.map(({ id, start }, i) => [
    id,
    {
      start,
      end: STORY_CHAPTERS[i + 1]?.start ?? 1,
      rest: PHASE_STOPS.find((stop) => stop.id === id)?.target ?? start,
    },
  ]),
) as Readonly<Record<ChapterId, ChapterPlace>>;

export const startOf = (id: ChapterId): number => CHAPTER_MAP[id].start;
export const restOf = (id: ChapterId): number => CHAPTER_MAP[id].rest;

/** The chapter you're in at master progress `mp`. */
export const chapterIdAt = (mp: number): ChapterId => STORY_CHAPTERS[chapterAt(STORY_CHAPTERS, mp)].id;
