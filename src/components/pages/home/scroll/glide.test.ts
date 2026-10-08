import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { jumpToJourney } from "./glide";

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
