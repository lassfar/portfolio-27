import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inertExcept } from "#/components/hooks/a11y/inertExcept";
import { landInBook } from "#/components/pages/home/book/place";
import { keepDraft } from "#/components/pages/home/contact/draft";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { holdInput } from "#/components/pages/home/motion/holdInput";
import { SWITCH } from "#/components/pages/home/story/copy";
import { preloadScene } from "#/components/three.js/scene/preload";
import { sceneFrames } from "#/components/three.js/scene/sceneFrames";
import { useModeSwitch } from "#/stores/useModeSwitch";
import { holdMotionAttribute, useMotion } from "#/stores/useMotion";
import { startModeSwitch } from "./modeSwitch";

// The page around the switch is stood in for: the unit tests run in Node, with fake timers.
const releaseInert = vi.fn();
const releaseInput = vi.fn();
vi.mock("#/components/hooks/a11y/inertExcept", () => ({ inertExcept: vi.fn(() => releaseInert) }));
vi.mock("#/components/pages/home/motion/holdInput", () => ({
  holdInput: vi.fn(() => releaseInput),
}));
vi.mock("#/components/pages/home/book/place", () => ({
  landInBook: vi.fn(),
  placeOnScreen: vi.fn(() => "lab"),
}));
vi.mock("#/components/pages/home/book/preload", () => ({ preloadBook: vi.fn(async () => {}) }));
vi.mock("#/components/pages/home/contact/draft", () => ({ keepDraft: vi.fn() }));
vi.mock("#/components/pages/home/scroll/chapters", () => ({ chapterIdAt: () => "earth" }));
vi.mock("#/components/three.js/scene/preload", () => ({ preloadScene: vi.fn(async () => {}) }));
vi.mock("#/stores/useMotion", async (actual) => ({
  ...(await actual<typeof import("#/stores/useMotion")>()),
  holdMotionAttribute: vi.fn(),
}));

/** The journey's motion code, once fetched (loadJourney.ts). */
const journey = {
  stopGlide: vi.fn(),
  waitForJourney: vi.fn(async () => true),
  refreshJourney: vi.fn(),
  landJourney: vi.fn(),
  holdJourneyOn: vi.fn(() => vi.fn()),
};
let journeyLoaded: typeof journey | null = null;
vi.mock("#/components/pages/home/loadJourney", () => ({
  loadJourneyMotion: Object.defineProperty(
    vi.fn(async () => (journeyLoaded = journey)),
    "loaded",
    { get: () => journeyLoaded },
  ),
}));

/** The page: <html>'s attributes, the focus, the switch's button, the timeline's star. */
let attributes: Set<string>;
const button = { contains: (el: unknown) => el === button, focus: vi.fn() };
const star = { focus: vi.fn() };
let active: unknown;

/** The visitor (or the device) asks for a mode. */
const choose = (choice: "calm" | "full") => useMotion.setState({ choice });
const veil = () => useModeSwitch.getState().veil;

describe("the live mode switch", () => {
  let stop: () => void;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    journeyLoaded = null;
    attributes = new Set();
    active = null;
    useMotion.setState({ device: false, choice: null });
    useModeSwitch.setState({ shown: null, veil: null, status: "" });
    // A frame every 16 ms; while the journey shows, its 3D draws one each frame.
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) =>
      setTimeout(() => {
        if (useModeSwitch.getState().shown === "full") sceneFrames.count++;
        cb(performance.now());
      }, 16),
    );
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
    vi.stubGlobal("getComputedStyle", () => ({ visibility: "visible" }));
    vi.stubGlobal("window", {
      scrollTo: vi.fn(),
      setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
      clearTimeout: (id: number) => clearTimeout(id),
    });
    const body = {};
    vi.stubGlobal("document", {
      body,
      get activeElement() {
        return active ?? body;
      },
      documentElement: {
        setAttribute: (name: string) => attributes.add(name),
        removeAttribute: (name: string) => attributes.delete(name),
      },
      querySelector: (selector: string) => (selector.includes("story-timeline") ? star : button),
    });
    stop = startModeSwitch("full");
  });

  afterEach(() => {
    stop();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("switches into calm behind the screen, lands on the same chapter, and gives the page back", async () => {
    choose("calm");
    // Capture, at once: the draft kept, the page covered, <html> held on the journey's mode.
    expect(keepDraft).toHaveBeenCalled();
    expect(attributes.has("data-mode-switching")).toBe(true);
    expect(holdMotionAttribute).toHaveBeenLastCalledWith("full");
    expect(veil()).toMatchObject({ to: "calm", place: "earth", shown: true });
    await vi.advanceTimersByTimeAsync(100);
    expect(inertExcept).toHaveBeenCalled();
    expect(holdInput).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2500);
    expect(useModeSwitch.getState().shown).toBe("calm");
    expect(landInBook).toHaveBeenLastCalledWith("earth", false);
    expect(releaseInert).toHaveBeenCalled();
    expect(releaseInput).toHaveBeenCalled();
    expect(attributes.has("data-mode-switching")).toBe(false);
    expect(holdMotionAttribute).toHaveBeenLastCalledWith(null);
    expect(useModeSwitch.getState().status).toBe(`${SWITCH.state.calm}: The Earth`);

    await vi.advanceTimersByTimeAsync(600);
    expect(veil()).toBeNull();
    // Said once: the status line clears.
    await vi.advanceTimersByTimeAsync(4000);
    expect(useModeSwitch.getState().status).toBe("");
  });

  it("stays opaque long enough to read (fade in, then the minimum hold)", async () => {
    choose("calm");
    await vi.advanceTimersByTimeAsync(1800);
    expect(veil()?.shown).toBe(true);
    await vi.advanceTimersByTimeAsync(400);
    expect(veil()?.shown).toBe(false);
  });

  it("goes to motion with the journey's code first, then lands its pin", async () => {
    useModeSwitch.setState({ shown: "calm" });
    choose("full");
    await vi.advanceTimersByTimeAsync(3000);
    expect(loadJourneyMotion).toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
    expect(useModeSwitch.getState().shown).toBe("full");
    expect(journey.refreshJourney).toHaveBeenCalled();
    expect(journey.landJourney).toHaveBeenCalledWith("lab");
    expect(journey.holdJourneyOn).toHaveBeenCalledWith("lab");
    expect(useModeSwitch.getState().status).toBe(`${SWITCH.state.full}: The Lab`);
  });

  it("says when the 3D takes its time", async () => {
    // The 3D's code never arrives: neither the capture's preload nor the swap's.
    const never = new Promise(() => {});
    vi.mocked(preloadScene).mockReturnValueOnce(never).mockReturnValueOnce(never);
    useModeSwitch.setState({ shown: "calm" });
    choose("full");
    await vi.advanceTimersByTimeAsync(3500);
    expect(veil()?.slow).toBe(true);
    expect(useModeSwitch.getState().status).toBe(SWITCH.slow);
  });

  it("ends on the last choice when pressed again during a switch", async () => {
    choose("calm");
    await vi.advanceTimersByTimeAsync(1000);
    choose("full");
    await vi.advanceTimersByTimeAsync(12000);
    expect(useModeSwitch.getState().shown).toBe("full");
    expect(journey.landJourney).toHaveBeenCalled();
    expect(veil()).toBeNull();
  });

  it("stops a glide only if the journey's code is there (none to stop before)", async () => {
    useModeSwitch.setState({ shown: "calm" });
    expect(() => choose("full")).not.toThrow();
    await vi.advanceTimersByTimeAsync(4000);
    choose("calm");
    expect(journey.stopGlide).toHaveBeenCalledTimes(1);
  });

  it("gives the page back even when a step breaks, and only reports it", async () => {
    const report = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(landInBook).mockImplementationOnce(() => {
      throw new Error("broken landing");
    });
    choose("calm");
    await vi.advanceTimersByTimeAsync(3000);
    expect(releaseInert).toHaveBeenCalled();
    expect(releaseInput).toHaveBeenCalled();
    expect(attributes.has("data-mode-switching")).toBe(false);
    expect(holdMotionAttribute).toHaveBeenLastCalledWith(null);
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ message: "broken landing" }));
  });

  it("gives the focus the landing chapter if it was in the page, not if it was on the switch", async () => {
    active = {};
    choose("calm");
    await vi.advanceTimersByTimeAsync(3000);
    expect(landInBook).toHaveBeenCalledWith("earth", true);

    vi.mocked(landInBook).mockClear();
    active = button;
    choose("full");
    await vi.advanceTimersByTimeAsync(4000);
    choose("calm");
    await vi.advanceTimersByTimeAsync(3000);
    expect(landInBook).not.toHaveBeenCalledWith(expect.anything(), true);
  });

  it("stops following the preference once stopped", async () => {
    stop();
    choose("calm");
    await vi.advanceTimersByTimeAsync(3000);
    expect(veil()).toBeNull();
    expect(useModeSwitch.getState().shown).toBeNull();
  });
});
