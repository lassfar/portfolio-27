import { describe, expect, it } from "vitest";
import { BOOK_CHAPTERS } from "#/components/pages/home/book/chapters";
import { STORY_CHAPTERS } from "./config";
import {
  chapterPositions,
  fillClip,
  phoneQuery,
  RAIL_CLEAR,
  railLayout,
  railPxFor,
  STAR_SPACING,
} from "./layout";
import { TIMELINE } from "./tuning";

describe("the timeline fill's clip", () => {
  it("shows the rail from its start as far as the fill, with round ends", () => {
    expect(fillClip(0.25, false)).toBe("inset(0 0 75% 0 round 9999px)");
    expect(fillClip(0.25, true)).toBe("inset(0 75% 0 0 round 9999px)");
  });

  it("shows nothing at 0 and the whole rail at 1", () => {
    expect(fillClip(0, false)).toBe("inset(0 0 100% 0 round 9999px)");
    expect(fillClip(1, true)).toBe("inset(0 0% 0 0 round 9999px)");
  });
});

describe("the rail on a short screen (a phone held sideways)", () => {
  /** Its stars' centres (px down the rail) on a screen `screenPx` tall. */
  const centres = (chapters: readonly (string | { start: number })[], screenPx: number) => {
    const rail = railPxFor(TIMELINE, screenPx, chapters.length);
    const named = chapters.map((c, i) =>
      typeof c === "string" ? { id: c, name: c, start: i / (chapters.length - 1) } : c,
    );
    return chapterPositions(named as typeof STORY_CHAPTERS, TIMELINE.minGap, rail).map(
      (p) => p * rail,
    );
  };
  const gaps = (at: number[]) => at.slice(1).map((y, i) => y - at[i]);

  it("keeps its stars 32 px apart, below the switch (390 px tall)", () => {
    for (const chapters of [STORY_CHAPTERS, BOOK_CHAPTERS]) {
      expect(railPxFor(TIMELINE, 390, chapters.length)).toBe((chapters.length - 1) * STAR_SPACING);
      gaps(centres(chapters, 390)).forEach((gap) =>
        expect(gap).toBeGreaterThanOrEqual(STAR_SPACING - 0.01),
      );
    }
  });

  it("fits below the switch on a shorter one, its stars never touching", () => {
    for (const chapters of [STORY_CHAPTERS, BOOK_CHAPTERS]) {
      const rail = railPxFor(TIMELINE, 320, chapters.length);
      expect(rail).toBeLessThanOrEqual(320 - RAIL_CLEAR.top - RAIL_CLEAR.bottom);
      gaps(centres(chapters, 320)).forEach((gap) => expect(gap).toBeGreaterThanOrEqual(24));
    }
  });

  it("starts below the switch's corner", () => {
    expect(railLayout(TIMELINE).place.top).toBe(
      `max(50%, calc(${RAIL_CLEAR.top}px + var(--tl-length) / 2))`,
    );
  });

  it("keeps its share of a taller screen", () => {
    expect(railPxFor(TIMELINE, 1000, 7)).toBe((1000 * TIMELINE.railLength) / 100);
  });
});

describe("the phone layout", () => {
  it("is narrow screens and any without hover (a landscape phone, a tablet)", () => {
    expect(phoneQuery(TIMELINE)).toBe(`(max-width: ${TIMELINE.phoneMaxWidth}px), (hover: none)`);
  });
});
