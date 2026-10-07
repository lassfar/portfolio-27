import { describe, expect, it } from "vitest";
import { PHASE_STOPS, nextStopAt } from "#/components/pages/home/phase-nav/config";
import { CHAPTER_IDS } from "#/components/pages/home/story/story.types";
import { mpAt } from "#/components/three.js/star/config";
import { CHAPTER_MAP, chapterIdAt, restOf, startOf } from "./chapters";

const EPS = mpAt(0.5);

describe("the chapter map", () => {
  it("places every chapter, in story order, each resting inside itself", () => {
    expect(Object.keys(CHAPTER_MAP)).toEqual([...CHAPTER_IDS]);
    CHAPTER_IDS.forEach((id, i) => {
      const { start, end, rest } = CHAPTER_MAP[id];
      expect(start, id).toBeLessThan(end);
      expect(rest, id).toBeGreaterThanOrEqual(start);
      expect(rest, id).toBeLessThan(end);
      if (i > 0) expect(rest, id).toBeGreaterThan(restOf(CHAPTER_IDS[i - 1]));
      expect(chapterIdAt(rest), id).toBe(id);
    });
  });

  it("rests Origin on the hero, and Contact before the very end", () => {
    expect(restOf("origin")).toBe(0);
    expect(restOf("contact")).toBeLessThan(1);
  });

  it("lands where the assistant lands, and offers the next stop from there", () => {
    PHASE_STOPS.forEach((stop, i) => {
      expect(restOf(stop.id), stop.id).toBe(stop.target);
      if (stop.window)
        expect(nextStopAt(restOf(stop.id))?.id, stop.id).toBe(PHASE_STOPS[i + 1]?.id);
    });
  });

  it("finds the chapter at any point of the journey", () => {
    expect(chapterIdAt(0)).toBe("origin");
    expect(chapterIdAt(1)).toBe("contact");
    CHAPTER_IDS.forEach((id, i) => {
      expect(chapterIdAt(startOf(id) + EPS), id).toBe(id);
      if (i > 0) expect(chapterIdAt(startOf(id) - EPS), id).toBe(CHAPTER_IDS[i - 1]);
    });
  });
});
