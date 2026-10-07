import { describe, expect, it } from "vitest";
import { PHASE_STOPS } from "#/components/pages/home/phase-nav/config";
import { VOICE } from "#/components/pages/home/story/copy";
import { CHAPTER_IDS } from "#/components/pages/home/story/story.types";
import { STORY_CHAPTERS } from "#/components/pages/home/timeline/config";
import { chapterAt } from "#/components/pages/home/timeline/layout";
import { JOURNEY, mpAt } from "#/components/three.js/star/config";
import { accentParts } from "#/components/UI/text/accent";
import {
  SUBTITLE_PLACEMENT,
  STORY_SUBTITLES,
  SUBTITLE_PACE,
  SUBTITLE_START,
  nextSubtitle,
  subtitleAt,
} from "./config";

const byId = (id: string) => STORY_SUBTITLES.find((s) => s.id === id)!;
const jp = (x: number) => x * JOURNEY.journeyEnd;
const EPS = mpAt(0.5);

describe("the story's subtitles", () => {
  it("show one at a time, in story order", () => {
    STORY_SUBTITLES.forEach((s, i) => {
      expect(s.window[0]).toBeLessThan(s.window[1]);
      if (i > 0) expect(s.window[0]).toBeGreaterThanOrEqual(STORY_SUBTITLES[i - 1].window[1]);
    });
  });

  it("show from 35% into their chapter to its end, clear of the texts of their own", () => {
    const chapter = (id: string): [number, number] => {
      const i = STORY_CHAPTERS.findIndex((c) => c.id === id);
      return [STORY_CHAPTERS[i].start, STORY_CHAPTERS[i + 1].start];
    };
    const startIn = ([from, to]: [number, number]) => from + SUBTITLE_START * (to - from);
    // The star: once the hero copy has lifted away too.
    const origin = chapter("origin");
    expect(byId("star").window).toEqual([
      Math.max(startIn(origin), jp(JOURNEY.contentExit)),
      origin[1],
    ]);
    expect(byId("star").window[0]).toBeGreaterThanOrEqual(jp(JOURNEY.contentExit)); // the hero copy
    // The Maker: until the About text slides in.
    expect(byId("saturn").window).toEqual([startIn(chapter("maker")), jp(JOURNEY.revealStart)]);
    for (const id of ["voyage", "lab", "way-out", "milky-way"]) {
      expect(byId(id).window).toEqual([startIn(chapter(id)), chapter(id)[1]]);
    }
    // The Earth: its whole rest, then on while it's still in view as the Lab pulls back.
    expect(byId("earth").window[0]).toBe(chapter("earth")[0]);
    expect(byId("earth").window[1]).toBeGreaterThan(chapter("earth")[1]);
    expect(byId("milky-way").window[1]).toBeLessThanOrEqual(JOURNEY.contactStart); // the form
  });

  it("each start in their own chapter", () => {
    const chapterOf: Record<string, string> = { star: "origin", saturn: "maker" };
    for (const {
      id,
      window: [from],
    } of STORY_SUBTITLES) {
      expect(STORY_CHAPTERS[chapterAt(STORY_CHAPTERS, from + EPS)].id, id).toBe(
        chapterOf[id] ?? id,
      );
    }
  });

  it("are on screen wherever the assistant lands you in a silent part", () => {
    for (const id of ["voyage", "earth", "lab", "way-out", "milky-way"]) {
      const { target } = PHASE_STOPS.find((stop) => stop.id === id)!;
      expect(STORY_SUBTITLES[subtitleAt(target)]?.id, id).toBe(id);
    }
  });

  it("pick the line whose window the scroll is in, and none between them", () => {
    STORY_SUBTITLES.forEach(({ window: [from, to], enabled }, i) => {
      expect(subtitleAt((from + to) / 2)).toBe(enabled ? i : -1); // an off line never shows
      expect(subtitleAt(from)).toBe(-1);
      expect(subtitleAt(to)).toBe(-1);
    });
    expect(subtitleAt(0)).toBe(-1); // the hero
    expect(subtitleAt(1)).toBe(-1); // the end: Contact
  });

  it("speak the story's own lines, one per chapter of the journey", () => {
    expect(STORY_CHAPTERS.map((c) => c.id)).toEqual([...CHAPTER_IDS]);
    const chapterOf: Record<string, keyof typeof VOICE> = { star: "origin", saturn: "maker" };
    for (const { id, line } of STORY_SUBTITLES) {
      expect(line, id).toBe(VOICE[chapterOf[id] ?? (id as keyof typeof VOICE)]);
    }
  });

  it("each have words in peach", () => {
    for (const { line } of STORY_SUBTITLES) {
      const parts = accentParts(line);
      expect(parts.map((p) => p.text).join("")).toBe(line.replaceAll("*", ""));
      expect(parts.some((p) => p.accent)).toBe(true);
    }
  });

  it("start unless you jump past, then stay until you leave", () => {
    const earth = STORY_SUBTITLES.findIndex((s) => s.id === "earth");
    const [from, to] = STORY_SUBTITLES[earth].window;
    const mid = (from + to) / 2;
    const fast = SUBTITLE_PACE.maxSpeed * 4;
    expect(nextSubtitle(-1, mid, fast)).toBe(-1); // a jump past: nothing
    expect(nextSubtitle(-1, mid, SUBTITLE_PACE.maxSpeed)).toBe(earth); // slow: it starts
    expect(nextSubtitle(-1, mid, 0)).toBe(earth); // stopped: it starts
    expect(nextSubtitle(earth, mid, fast)).toBe(earth); // started: it stays
    expect(nextSubtitle(earth, to + mpAt(1), 0)).toBe(-1); // the next chapter's start: none yet
    const saturn = STORY_SUBTITLES.findIndex((s) => s.id === "saturn");
    expect(nextSubtitle(saturn, byId("saturn").window[1] + mpAt(1), 0)).toBe(-1); // the About text: none
  });

  it("keep a line out of the assistant's glides when it's set so", () => {
    const saturn = STORY_SUBTITLES.findIndex((s) => s.id === "saturn");
    const lab = STORY_SUBTITLES.findIndex((s) => s.id === "lab");
    const mid = (i: number) => (STORY_SUBTITLES[i].window[0] + STORY_SUBTITLES[i].window[1]) / 2;
    expect(STORY_SUBTITLES[saturn].onAssistantGlide).toBe(false);
    expect(nextSubtitle(-1, mid(saturn), 0)).toBe(saturn); // your own scroll: it shows
    expect(nextSubtitle(-1, mid(saturn), 0, true)).toBe(-1); // the assistant's glide: it doesn't
    expect(nextSubtitle(saturn, mid(saturn), 0, true)).toBe(-1); // …nor stays
    expect(nextSubtitle(-1, mid(lab), 0, true)).toBe(lab); // the others still show
  });

  it("show none on the way back up", () => {
    const lab = STORY_SUBTITLES.findIndex((s) => s.id === "lab");
    const mid = (STORY_SUBTITLES[lab].window[0] + STORY_SUBTITLES[lab].window[1]) / 2;
    expect(SUBTITLE_PACE.onScrollBack).toBe(false);
    expect(nextSubtitle(-1, mid, 0, false, true)).toBe(-1); // scrolling back: none starts
    expect(nextSubtitle(lab, mid, 0, false, true)).toBe(-1); // …and a showing one goes
    expect(nextSubtitle(-1, mid, 0, false, false)).toBe(lab); // forward again: it shows
  });

  it("show each line once per visit", () => {
    const lab = STORY_SUBTITLES.findIndex((s) => s.id === "lab");
    const mid = (STORY_SUBTITLES[lab].window[0] + STORY_SUBTITLES[lab].window[1]) / 2;
    const seen = new Set([lab]);
    expect(SUBTITLE_PACE.onceEach).toBe(true);
    expect(nextSubtitle(lab, mid, 0, false, false, seen)).toBe(lab); // showing: it stays
    expect(nextSubtitle(-1, mid, 0, false, false, seen)).toBe(-1); // back up, then forward again: not again
    expect(nextSubtitle(-1, mid, 0, false, false, new Set())).toBe(lab); // not seen yet: it shows
  });

  it("sit bottom left unless a line has its own placement", () => {
    expect(SUBTITLE_PLACEMENT).toBe("bottom-left");
    for (const s of STORY_SUBTITLES) expect(s.placement ?? SUBTITLE_PLACEMENT).toBe("bottom-left");
  });
});
