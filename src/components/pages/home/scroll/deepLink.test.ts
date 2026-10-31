import { describe, expect, it } from "vitest";
import { CHAPTER_IDS } from "#/components/pages/home/story/story.types";
import { addressFor, chapterFromHash } from "./deepLink";

describe("chapterFromHash (P27-113)", () => {
  it("reads every chapter's own id", () => {
    for (const id of CHAPTER_IDS) expect(chapterFromHash(`#${id}`)).toBe(id);
  });

  it("takes the names as people write them", () => {
    for (const hash of ["#Craft", "#CRAFT", "#the-craft", "#TheCraft", "#the_craft", "craft"])
      expect(chapterFromHash(hash), hash).toBe("craft");
    for (const hash of ["#wayout", "#WayOut", "#Way%20Out", "#the-way-out"])
      expect(chapterFromHash(hash), hash).toBe("way-out");
    expect(chapterFromHash("#TheMilkyWay")).toBe("milky-way");
  });

  it("names no chapter for anything else", () => {
    for (const hash of ["", "#", "#nonsense", "#the", "#%E0%A4%A", "#journey-contact-title"])
      expect(chapterFromHash(hash), hash).toBeNull();
  });
});

describe("addressFor (P27-113)", () => {
  it("puts the chapter in the hash, keeping the rest", () => {
    expect(addressFor("craft", "https://www.lassfar.com/")).toBe("https://www.lassfar.com/#craft");
    expect(addressFor("earth", "https://www.lassfar.com/?motion=calm#craft")).toBe(
      "https://www.lassfar.com/?motion=calm#earth",
    );
  });

  it("drops the hash for Origin, the top", () => {
    expect(addressFor("origin", "https://www.lassfar.com/#craft")).toBe("https://www.lassfar.com/");
    expect(addressFor("origin", "https://www.lassfar.com/?motion=full#lab")).toBe(
      "https://www.lassfar.com/?motion=full",
    );
  });
});
