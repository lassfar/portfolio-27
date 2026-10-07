/**
 * The story's chapters, in order (P27-91): the one list both ways of telling it follow,
 * the 3D journey and the calm book (reduced motion). The Voyage and The Way Out are
 * chapters of the journey; the book tells them as passages between its own (PASSAGES).
 */
export const CHAPTER_IDS = [
  "origin",
  "maker",
  "craft",
  "voyage",
  "earth",
  "lab",
  "way-out",
  "milky-way",
  "contact",
] as const;
export type ChapterId = (typeof CHAPTER_IDS)[number];
