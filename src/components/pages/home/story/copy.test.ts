import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { accentParts } from "#/components/UI/text/accent";
import { ABOUT, BOOK, BRIDGES, CHAPTER_NAMES, CONTACT, CRAFT, HERO, PASSAGES, VOICE } from "./copy";
import { CHAPTER_IDS } from "./story.types";

/** A text with `*accents*`: it reads the same without the marks, and has a word in peach. */
const expectAccented = (text: string) => {
  const parts = accentParts(text);
  expect(parts.map((p) => p.text).join(""), text).toBe(text.replaceAll("*", ""));
  expect(
    parts.some((p) => p.accent),
    text,
  ).toBe(true);
};

describe("the story's words", () => {
  it("name every chapter, once", () => {
    expect(new Set(CHAPTER_IDS).size).toBe(CHAPTER_IDS.length);
    const names = CHAPTER_IDS.map((id) => CHAPTER_NAMES[id]);
    expect(names.every((name) => name.length > 0)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });

  it("leave the calm book its seven chapters, the passages told between them", () => {
    expect(PASSAGES.every((id) => CHAPTER_IDS.includes(id))).toBe(true);
    expect(CHAPTER_IDS.filter((id) => !PASSAGES.includes(id))).toEqual([
      "origin",
      "maker",
      "craft",
      "earth",
      "lab",
      "milky-way",
      "contact",
    ]);
  });

  it("give every voice line and display title a word in peach", () => {
    Object.values(VOICE).forEach(expectAccented);
    [HERO.headline, ABOUT.title, CRAFT.title, CONTACT.title, CONTACT.thanks.title].forEach(
      expectAccented,
    );
  });

  it("give the calm book its bridges: one after each chapter but the last two, eight lines with the ending", () => {
    const chapters = CHAPTER_IDS.filter((id) => !PASSAGES.includes(id));
    expect(BRIDGES.map((b) => b.after)).toEqual(chapters.slice(0, -2));
    expect(BRIDGES.flatMap((b) => b.lines).length + 1).toBe(8);
    // Each passage is told inside the bridge right before its chapter would have come.
    BRIDGES.forEach((bridge) => {
      if (!("passage" in bridge)) return;
      const at = CHAPTER_IDS.indexOf(bridge.passage);
      expect(CHAPTER_IDS[at - 1], bridge.passage).toBe(bridge.after);
      expect(bridge.lines, bridge.passage).toHaveLength(2);
    });
    expect(BRIDGES.filter((b) => "passage" in b).map((b) => b.passage)).toEqual(PASSAGES);
    [...BRIDGES.flatMap((b) => b.lines), BOOK.ending].forEach((line) =>
      expect(line.trim().length, line).toBeGreaterThan(10),
    );
  });

  it("give the calm book's own titles a word in peach", () => {
    Object.values(BOOK.titles).forEach(expectAccented);
  });

  it("load none of the 3D: no imports but types, here and in the places and the Lab's card", () => {
    const files = [
      "components/pages/home/story/copy.ts",
      "components/pages/home/story/story.types.ts",
      "components/pages/home/skills/constellation.ts",
      "components/three.js/earth/data.ts",
      "components/three.js/voyager/data.ts",
    ];
    for (const file of files) {
      const source = readFileSync(join(process.cwd(), "src", file), "utf8");
      const imports = source.match(/^import\s.*$/gm) ?? [];
      expect(
        imports.filter((line) => !/^import type\s/.test(line)),
        file,
      ).toEqual([]);
    }
  });
});
