import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollSmoother } from "gsap/all";

// No GSAP in the unit tests: the smoother is stood in for.
vi.mock("gsap/all", () => ({ ScrollSmoother: { get: vi.fn() } }));

/** What happened, in order: the guards going on and off, the smoother pausing. */
let calls: string[];
const smoother = { paused: vi.fn((on: boolean) => calls.push(on ? "pause" : "resume")) };

// A fresh registry each time (it keeps its locks at module level).
const load = () => import("./scrollLock");

describe("the scroll lock", () => {
  beforeEach(() => {
    vi.resetModules();
    calls = [];
    smoother.paused.mockClear();
    vi.mocked(ScrollSmoother.get).mockReturnValue(smoother as unknown as ScrollSmoother);
    vi.stubGlobal("window", {
      addEventListener: vi.fn((type: string) => type === "wheel" && calls.push("guard on")),
      removeEventListener: vi.fn((type: string) => type === "wheel" && calls.push("guard off")),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("pauses with the first lock and resumes with the last release, guarded meanwhile", async () => {
    const { isScrollLocked, setScrollLock } = await load();
    setScrollLock("panel", true);
    setScrollLock("arrival", true);
    setScrollLock("panel", false);
    expect(isScrollLocked()).toBe(true);
    setScrollLock("arrival", false);
    expect(isScrollLocked()).toBe(false);
    // The guards go on before the smoother's own listeners, and off after it resumes.
    expect(calls).toEqual(["guard on", "pause", "resume", "guard off"]);
  });

  it("takes the guards off even when the smoother has gone (the mode switch unmounted it)", async () => {
    const { setScrollLock } = await load();
    setScrollLock("panel", true);
    vi.mocked(ScrollSmoother.get).mockReturnValue(undefined as unknown as ScrollSmoother);
    setScrollLock("panel", false);
    expect(calls).toEqual(["guard on", "pause", "guard off"]);
  });
});
