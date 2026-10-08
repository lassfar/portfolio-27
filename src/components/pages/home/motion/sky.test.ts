import { describe, expect, it } from "vitest";
import { BOOK_CHAPTERS } from "#/components/pages/home/book/chapters";
import { SKY, skyOf } from "#/components/pages/home/motion/sky";
import { CHAPTER_IDS } from "#/components/pages/home/story/story.types";

describe("the transition screen's constellation", () => {
  it("has a star per chapter of the mode it goes to", () => {
    expect(skyOf("calm", "earth").points).toHaveLength(BOOK_CHAPTERS.length);
    expect(skyOf("full", "earth").points).toHaveLength(CHAPTER_IDS.length);
  });

  it("lights and names the landing chapter, counted in that mode", () => {
    expect(skyOf("calm", "earth")).toMatchObject({
      here: 3,
      name: "The Earth",
      where: "Chapter 4 of 7",
    });
    expect(skyOf("full", "earth")).toMatchObject({ here: 4, where: "Chapter 5 of 9" });
    expect(skyOf("full", "voyage")).toMatchObject({ here: 3, name: "The Voyage" });
  });

  it("lights the chapter before a passage in the book, under the passage's name", () => {
    expect(skyOf("calm", "voyage")).toMatchObject({
      here: BOOK_CHAPTERS.indexOf("craft"),
      name: "The Voyage",
      where: "Between chapters 3 and 4",
    });
    expect(skyOf("calm", "way-out")).toMatchObject({
      here: BOOK_CHAPTERS.indexOf("lab"),
      where: "Between chapters 5 and 6",
    });
  });

  it("spans the sky, left to right, inside it", () => {
    for (const to of ["calm", "full"] as const) {
      const { points } = skyOf(to, "origin");
      expect(points[0].x).toBe(SKY.margin);
      expect(points.at(-1)?.x).toBe(SKY.width - SKY.margin);
      for (const [i, p] of points.entries()) {
        if (i) expect(p.x).toBeGreaterThan(points[i - 1].x);
        expect(p.y + 34).toBeLessThanOrEqual(SKY.height); // room for the name under it
      }
    }
  });
});
