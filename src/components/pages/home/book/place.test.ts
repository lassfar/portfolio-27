import { describe, expect, it } from "vitest";
import { BOOK_CHAPTERS } from "#/components/pages/home/book/chapters";
import { placeAt } from "#/components/pages/home/book/place";
import { BRIDGES, PASSAGES } from "#/components/pages/home/story/copy";
import { CHAPTER_IDS } from "#/components/pages/home/story/story.types";

describe("placeAt", () => {
  it("is the last place whose top has passed the line", () => {
    expect(placeAt([-900, -100, 300, 1200], 400)).toBe(2);
    expect(placeAt([-900, -100, 500, 1200], 400)).toBe(1);
  });

  it("is the first while none has", () => {
    expect(placeAt([450, 1200], 400)).toBe(0);
  });

  it("counts a top exactly on the line as passed", () => {
    expect(placeAt([0, 400], 400)).toBe(1);
  });

  it("skips a place not in the page", () => {
    expect(placeAt([-500, undefined, 100], 400)).toBe(2);
    expect(placeAt([-500, 100, undefined], 400)).toBe(1);
  });
});

describe("the book's places", () => {
  it("has one for every chapter of the journey: a section, or a passage's bridge", () => {
    for (const id of CHAPTER_IDS) {
      const section = BOOK_CHAPTERS.includes(id);
      const bridge = BRIDGES.some((b) => "passage" in b && b.passage === id);
      expect(section !== bridge, id).toBe(true);
    }
  });

  it("keeps the story's order: a passage's bridge follows the chapter before it", () => {
    for (const passage of PASSAGES) {
      const bridge = BRIDGES.find((b) => "passage" in b && b.passage === passage);
      expect(bridge?.after).toBe(CHAPTER_IDS[CHAPTER_IDS.indexOf(passage) - 1]);
    }
  });
});
