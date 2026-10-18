import { describe, expect, it, vi } from "vitest";
import {
  canScroll,
  followTop,
  followWriting,
  keyScroll,
  revealTop,
  writingAt,
} from "./overlayScroll";

// No GSAP in the unit tests (glide.ts and the scroll lock import it).
vi.mock("gsap", () => ({ default: { to: vi.fn(), killTweensOf: vi.fn() } }));
vi.mock("gsap/all", () => ({ ScrollSmoother: { get: vi.fn() }, ScrollTrigger: {} }));

describe("canScroll", () => {
  it("goes down until its bottom, up until its top", () => {
    expect(canScroll(0, 300, 1)).toBe(true);
    expect(canScroll(300, 300, 1)).toBe(false);
    expect(canScroll(0, 300, -1)).toBe(false);
    expect(canScroll(120, 300, -1)).toBe(true);
  });

  it("counts a sub-pixel rest as the end (scrollTop rounds)", () => {
    expect(canScroll(299.6, 300, 1)).toBe(false);
    expect(canScroll(0.4, 300, -1)).toBe(false);
  });

  it("never scrolls a box that fits", () => {
    expect(canScroll(0, 0, 1)).toBe(false);
    expect(canScroll(0, 0, -1)).toBe(false);
  });
});

describe("keyScroll", () => {
  it("moves by a line, a page or to an end", () => {
    expect(keyScroll("ArrowDown", false, 400, 900)).toBe(40);
    expect(keyScroll("ArrowUp", false, 400, 900)).toBe(-40);
    expect(keyScroll("PageDown", false, 400, 900)).toBe(340);
    expect(keyScroll("PageUp", false, 400, 900)).toBe(-340);
    expect(keyScroll("End", false, 400, 900)).toBe(900);
    expect(keyScroll("Home", false, 400, 900)).toBe(-900);
  });

  it("pages with Space, back with Shift", () => {
    expect(keyScroll(" ", false, 400, 900)).toBe(340);
    expect(keyScroll(" ", true, 400, 900)).toBe(-340);
  });

  it("leaves other keys alone", () => {
    expect(keyScroll("Tab", false, 400, 900)).toBeNull();
    expect(keyScroll("Enter", false, 400, 900)).toBeNull();
  });
});

describe("revealTop", () => {
  it("leaves a field that's in view", () => {
    expect(revealTop(100, 300, 150, 200, 16)).toBe(100);
  });

  it("scrolls up to a field above, with the margin", () => {
    expect(revealTop(300, 300, 120, 170, 16)).toBe(104);
  });

  it("scrolls down to a field below, just enough", () => {
    expect(revealTop(0, 300, 400, 450, 16)).toBe(166);
  });

  it("shows the top of something taller than the box", () => {
    expect(revealTop(0, 300, 400, 900, 16)).toBe(384);
  });

  it("never goes above the top", () => {
    expect(revealTop(50, 300, 4, 40, 16)).toBe(0);
  });
});

describe("writingAt", () => {
  const parts = [
    { top: 100, height: 200 },
    { top: 340, height: 160 },
  ];

  it("writes the first part over the first half, the second over the second", () => {
    expect(writingAt(0, parts)).toBe(100);
    expect(writingAt(0.5, parts)).toBe(340);
    expect(writingAt(1, parts)).toBe(500);
  });

  it("follows the newest word started: ahead of an even pace (they start over 55% of a share)", () => {
    expect(writingAt(0.25, parts)).toBeCloseTo(100 + (0.5 / 0.55) * 200);
    expect(writingAt(0.75, parts)).toBeCloseTo(340 + (0.5 / 0.55) * 160);
    // Every word of the first part started by 55% of its share: the writing waits at its end.
    expect(writingAt(0.4, parts)).toBe(300);
  });

  it("stays within the write-in", () => {
    expect(writingAt(-1, parts)).toBe(100);
    expect(writingAt(2, parts)).toBe(500);
  });

  it("is the top without parts", () => {
    expect(writingAt(0.5, [])).toBe(0);
  });
});

describe("followTop", () => {
  it("keeps the writing at 60% of the box", () => {
    expect(followTop(500, 300, 1000)).toBe(320);
  });

  it("stays within the scroll", () => {
    expect(followTop(50, 300, 1000)).toBe(0);
    expect(followTop(2000, 300, 1000)).toBe(1000);
  });
});

describe("followWriting", () => {
  // The About at 320×256: its first paragraph starts below the box (under the title).
  const parts = [
    { top: 243, height: 220 },
    { top: 487, height: 209 },
  ];

  it("shows the title before anything is written", () => {
    expect(followWriting(0, parts, 256, 464)).toBe(0);
  });

  it("eases into following the writing, then follows it", () => {
    const early = followWriting(0.02, parts, 256, 464);
    expect(early).toBeGreaterThan(0);
    expect(early).toBeLessThan(followTop(writingAt(0.02, parts), 256, 464));
    expect(followWriting(0.5, parts, 256, 464)).toBe(followTop(writingAt(0.5, parts), 256, 464));
  });

  it("ends at the bottom", () => {
    expect(followWriting(1, parts, 256, 464)).toBe(464);
  });
});
