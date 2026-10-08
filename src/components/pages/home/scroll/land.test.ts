import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { restOf } from "./chapters";
import { jumpToJourney, stopGlide } from "./glide";
import { holdJourneyOn, landJourney, refreshJourney, waitForJourney } from "./land";

// No GSAP in the unit tests: the smoother, the pin and the scroll are stood in for.
vi.mock("gsap/all", () => ({
  ScrollSmoother: { get: vi.fn() },
  ScrollTrigger: { addEventListener: vi.fn(), removeEventListener: vi.fn(), refresh: vi.fn() },
}));
vi.mock("./glide", () => ({ jumpToJourney: vi.fn(() => true), stopGlide: vi.fn() }));

const scrub = { progress: vi.fn() };
const pin = { update: vi.fn(), getTween: vi.fn(() => scrub) };
const withJourney = () => {
  journeyTrigger.current = pin as unknown as ScrollTrigger;
  vi.mocked(ScrollSmoother.get).mockReturnValue({} as ScrollSmoother);
};

describe("landJourney", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    journeyTrigger.current = null;
    vi.mocked(ScrollSmoother.get).mockReturnValue(undefined as unknown as ScrollSmoother);
  });

  it("jumps to the chapter's resting view, the scrubbed story there at once", () => {
    withJourney();
    expect(landJourney("earth")).toBe(true);
    expect(stopGlide).toHaveBeenCalled();
    expect(jumpToJourney).toHaveBeenCalledWith(restOf("earth"));
    expect(pin.update).toHaveBeenCalled();
    expect(scrub.progress).toHaveBeenCalledWith(1);
  });

  it("can't without the pinned journey and its smoother", () => {
    expect(landJourney("earth")).toBe(false);
    journeyTrigger.current = pin as unknown as ScrollTrigger;
    expect(landJourney("earth")).toBe(false);
    expect(jumpToJourney).not.toHaveBeenCalled();
  });

  it("measures the journey again on request", () => {
    refreshJourney();
    expect(ScrollTrigger.refresh).toHaveBeenCalled();
  });

  it("lands again on each refresh, until stopped", () => {
    const stop = holdJourneyOn("lab");
    const [, land] = vi.mocked(ScrollTrigger.addEventListener).mock.calls[0];
    withJourney();
    (land as () => void)();
    expect(jumpToJourney).toHaveBeenCalledWith(restOf("lab"));
    stop();
    expect(ScrollTrigger.removeEventListener).toHaveBeenCalledWith("refresh", land);
  });
});

describe("waitForJourney", () => {
  let frames: (() => void)[] = [];
  beforeEach(() => {
    frames = [];
    journeyTrigger.current = null;
    vi.mocked(ScrollSmoother.get).mockReturnValue(undefined as unknown as ScrollSmoother);
    vi.stubGlobal("requestAnimationFrame", (f: () => void) => frames.push(f));
  });
  afterEach(() => vi.unstubAllGlobals());
  const nextFrame = () => frames.shift()?.();

  it("resolves once the pin and the smoother are both there", async () => {
    const ready = waitForJourney(3000);
    nextFrame();
    withJourney();
    nextFrame();
    await expect(ready).resolves.toBe(true);
  });

  it("gives up after the time-out", async () => {
    const now = vi.spyOn(performance, "now").mockReturnValue(0);
    const ready = waitForJourney(3000);
    now.mockReturnValue(3000);
    nextFrame();
    await expect(ready).resolves.toBe(false);
    now.mockRestore();
  });

  it("gives up when aborted", async () => {
    const abort = new AbortController();
    const ready = waitForJourney(3000, abort.signal);
    abort.abort();
    nextFrame();
    await expect(ready).resolves.toBe(false);
  });
});
