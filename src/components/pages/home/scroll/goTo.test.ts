import { beforeEach, describe, expect, it, vi } from "vitest";
import { glideSeconds } from "#/components/pages/home/phase-nav/config";
import { isScrollLocked } from "#/stores/scrollLock";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { restOf } from "./chapters";
import { glideToJourney, jumpToJourney, stopGlide } from "./glide";
import { goTo } from "./goTo";

// No GSAP in the unit tests: the scroll itself is stood in for.
vi.mock("./glide", () => ({
  glideToJourney: vi.fn(() => true),
  jumpToJourney: vi.fn(() => true),
  stopGlide: vi.fn(),
}));
vi.mock("#/stores/scrollLock", () => ({ isScrollLocked: vi.fn(() => false) }));

describe("goTo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJourneyScroll.setState({ progress: 0 });
  });

  it("glides to the chapter's resting view, at the assistant's pace", () => {
    useJourneyScroll.setState({ progress: 0.1 });
    expect(goTo("earth", { by: "assistant", ease: "none" })).toBe(true);
    const rest = restOf("earth");
    expect(glideToJourney).toHaveBeenCalledWith(
      rest,
      glideSeconds(rest - 0.1),
      "none",
      "assistant",
    );
  });

  it("takes the time it's given, and the glide's own ease by default", () => {
    goTo("lab", { seconds: 1.5, by: "timeline" });
    expect(glideToJourney).toHaveBeenCalledWith(restOf("lab"), 1.5, undefined, "timeline");
  });

  it("says when it couldn't move (no pinned journey)", () => {
    vi.mocked(glideToJourney).mockReturnValueOnce(false);
    expect(goTo("maker")).toBe(false);
  });

  it("jumps on request, stopping any glide first", () => {
    expect(goTo("craft", { instant: true })).toBe(true);
    expect(stopGlide).toHaveBeenCalled();
    expect(jumpToJourney).toHaveBeenCalledWith(restOf("craft"));
    expect(glideToJourney).not.toHaveBeenCalled();
  });

  it("won't jump while a panel holds the scroll", () => {
    vi.mocked(isScrollLocked).mockReturnValueOnce(true);
    expect(goTo("craft", { instant: true })).toBe(false);
    expect(jumpToJourney).not.toHaveBeenCalled();
  });
});
