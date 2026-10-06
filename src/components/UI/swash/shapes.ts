/**
 * The hand-drawn swashes (P27-83): pen strokes Aymane drew, traced into a few smooth
 * Bézier curves and flattened to a title line's height, like a designed one
 * (`.claude/tasks/P27-83-section-title-swashes/tools/trace.cjs`), each in its own viewBox:
 * 300 wide for the short set, 600 for the long one (long titles; trace those at 600). A
 * path runs from where the pen started, so it draws itself in that way.
 */
/** A title's length: a short swash (a 300-wide box) or a long one (600 wide), for long titles. */
export type SwashLength = "short" | "long";

/** One pen stroke: `M x y` then cubic curves (`C x y, x y, x y`), in a box `width` × `height`. */
export type SwashShape = { length: SwashLength; viewBox: string; d: string };

/** A box's width per set: the line is 1.5 units of it, so each set keeps the same fine line at its full width. */
export const SWASH_BOX_WIDTH: Record<SwashLength, number> = { short: 300, long: 600 };

export const SWASHES = {
  /** One long stroke with a small loop at its end (the panels' first swash, P27-80). */
  loopEnd: {
    length: "short",
    viewBox: "0 0 300 30",
    d: "M10 20 C 62 8, 118 28, 176 17 C 212 10, 244 8, 262 15 C 276 20, 274 28, 264 27 C 254 26, 258 12, 292 9",
  },
  /** A hook, a loop near the start, then a long falling stroke rising at the end (drawing 1). */
  loopStart: {
    length: "short",
    viewBox: "0 0 300 30",
    d:
      "M11.9 26.8 C 2 7.7, 64.1 8.6, 69.1 18.7 C 73.6 27.8, 44 22.8, 50.5 12.2 " +
      "C 56.8 2, 85.1 8.2, 94.1 10.3 C 143.6 22.3, 192.5 24.7, 243.4 23.8 " +
      "C 258.3 23.5, 288.6 23.7, 298 9.6",
  },
  /** A curl, a dip, a loop in the middle, then a long rise (drawing 2). */
  loopMiddle: {
    length: "short",
    viewBox: "0 0 300 27",
    d:
      "M11.3 19.1 C 4.9 19.5, 2 12.6, 9.2 10.9 C 18.3 8.7, 29.2 13.1, 37.9 15.3 " +
      "C 63.7 22.1, 94.9 24.9, 121.5 22.7 C 127.4 22.2, 174.9 16.7, 169.4 5.7 " +
      "C 167.6 2, 159.1 2.1, 158 6.4 C 155.2 17.4, 179.6 18.8, 185.5 19.1 " +
      "C 213.8 20.5, 274.8 22.1, 298 4.2",
  },
} as const satisfies Record<string, SwashShape>;

export type SwashName = keyof typeof SWASHES;

export const SWASH_NAMES = Object.keys(SWASHES) as SwashName[];
