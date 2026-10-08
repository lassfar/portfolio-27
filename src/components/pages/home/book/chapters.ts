import { PASSAGES } from "#/components/pages/home/story/copy";
import { CHAPTER_IDS, type ChapterId } from "#/components/pages/home/story/story.types";

/** The calm book's chapters, in story order (P27-93): the journey's, but the two it tells as passages. */
export const BOOK_CHAPTERS: readonly ChapterId[] = CHAPTER_IDS.filter(
  (id) => !PASSAGES.includes(id),
);

/** A chapter's number in the book: Origin is 1. */
export const chapterNumber = (id: ChapterId) => BOOK_CHAPTERS.indexOf(id) + 1;

/** A chapter's heading id: the rail moves the focus there. */
export const titleId = (id: ChapterId) => `${id}-title`;
