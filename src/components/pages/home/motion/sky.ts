import { BOOK_CHAPTERS } from "#/components/pages/home/book/chapters";
import { CHAPTER_NAMES, SWITCH } from "#/components/pages/home/story/copy";
import { CHAPTER_IDS, type ChapterId } from "#/components/pages/home/story/story.types";
import type { MotionChoice } from "#/stores/motionPreference";

/** The sky's size (its SVG viewBox). */
export const SKY = { width: 640, height: 200, margin: 30 } as const;

/** The stars' heights, left to right: a constellation's zigzag (sampled for fewer stars). */
const HEIGHTS = [150, 112, 138, 86, 108, 62, 96, 128, 74];

export type Sky = {
  /** The stars, one per chapter of the mode it goes to, left to right. */
  points: readonly { x: number; y: number }[];
  /** The star where the visitor lands. */
  here: number;
  /** Its name: the chapter's, or the passage's in the book. */
  name: string;
  /** "Chapter 4 of 7", or "Between chapters 3 and 4" for a passage in the book. */
  where: string;
};

/**
 * The transition screen's constellation (P27-94): the chapters of the mode it goes to (the
 * book's 7, or the journey's 9), and where the visitor lands among them. A passage (The
 * Voyage, The Way Out) has no star in the book: the chapter before it is lit, under the
 * passage's name.
 */
export function skyOf(to: MotionChoice, place: ChapterId): Sky {
  const ids = to === "calm" ? BOOK_CHAPTERS : CHAPTER_IDS;
  const last = ids.length - 1;
  const points = ids.map((_, i) => ({
    x: Math.round(SKY.margin + ((SKY.width - 2 * SKY.margin) * i) / last),
    y: HEIGHTS[Math.round((i * (HEIGHTS.length - 1)) / last)],
  }));
  const name = CHAPTER_NAMES[place];
  const at = ids.indexOf(place);
  if (at >= 0) {
    return {
      points,
      here: at,
      name,
      where: `${SWITCH.chapter} ${at + 1} ${SWITCH.of} ${ids.length}`,
    };
  }
  const here = ids.indexOf(CHAPTER_IDS[CHAPTER_IDS.indexOf(place) - 1]);
  return { points, here, name, where: `${SWITCH.between} ${here + 1} ${SWITCH.and} ${here + 2}` };
}

/** A four-pointed star's outline, centred on (x, y), its points `r` out. */
export const starPath = (x: number, y: number, r: number) => {
  const k = r * 0.28;
  return `M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`;
};
