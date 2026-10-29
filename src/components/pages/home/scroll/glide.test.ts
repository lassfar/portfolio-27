import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { GLIDE_GRACE_MS, inGlideGrace, isScrollKey, jumpToJourney } from "./glide";

// No GSAP in the unit tests: the smoother and the pin are stood in for.
vi.mock("gsap", () => ({ default: { to: vi.fn(), killTweensOf: vi.fn() } }));
vi.mock("gsap/all", () => ({
  ScrollSmoother: { get: vi.fn() },
  ScrollTrigger: { maxScroll: vi.fn(() => 10000) },
}));

const smoother = { scrollTop: vi.fn(() => 0), scrollTo: vi.fn() };

describe("jumpToJourney", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    journeyTrigger.current = { start: 0, end: 8000 } as ScrollTrigger;
    vi.mocked(ScrollSmoother.get).mockReturnValue(smoother as unknown as ScrollSmoother);
    vi.stubGlobal("window", {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it("jumps the smooth scroll to the point, at once", () => {
    expect(jumpToJourney(0.5)).toBe(true);
    expect(smoother.scrollTo).toHaveBeenCalledWith(4000, false);
  });

  it("leaves it alone when it's already there (ScrollSmoother would swallow the next scroll)", () => {
    smoother.scrollTop.mockReturnValueOnce(4000);
    expect(jumpToJourney(0.5)).toBe(true);
    expect(smoother.scrollTo).not.toHaveBeenCalled();
  });

  it("stops at the end of the page", () => {
    vi.mocked(ScrollTrigger.maxScroll).mockReturnValueOnce(6000);
    jumpToJourney(1);
    expect(smoother.scrollTo).toHaveBeenCalledWith(6000, false);
  });

  it("can't without the pinned journey", () => {
    journeyTrigger.current = null;
    expect(jumpToJourney(0.5)).toBe(false);
  });
});

describe("isScrollKey", () => {
  const press = (key: string, target: Partial<HTMLElement> | null = null) =>
    isScrollKey({ key, target: target as EventTarget | null });

  it("takes the scroll back on the keys that scroll the page", () => {
    for (const key of [" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"]) {
      expect(press(key)).toBe(true);
    }
  });

  it("lets the glide run on Tab, Enter, Escape, a modifier or a letter", () => {
    for (const key of ["Tab", "Enter", "Escape", "Shift", "Meta", "a", "ArrowLeft"]) {
      expect(press(key)).toBe(false);
    }
  });

  it("not on a key typed in a field", () => {
    expect(press(" ", { tagName: "TEXTAREA", isContentEditable: false })).toBe(false);
    expect(press("ArrowDown", { tagName: "INPUT", isContentEditable: false })).toBe(false);
    expect(press(" ", { tagName: "DIV", isContentEditable: true })).toBe(false);
    expect(press(" ", { tagName: "BUTTON", isContentEditable: false })).toBe(true);
  });
});

describe("inGlideGrace (P27-108)", () => {
  it("ignores a wheel or touch in a glide's first moments (a scroll's leftover momentum)", () => {
    expect(inGlideGrace(1000, 1000)).toBe(true); // the glide's own frame
    expect(inGlideGrace(1000 + GLIDE_GRACE_MS - 1, 1000)).toBe(true);
  });
  it("lets one take the scroll back after that", () => {
    expect(inGlideGrace(1000 + GLIDE_GRACE_MS, 1000)).toBe(false);
    expect(inGlideGrace(1000, -Infinity)).toBe(false); // no glide started yet
  });
});
