import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { holdInput } from "./holdInput";

/** A button, as the keys see it (the unit tests run in Node). */
class FakeButton {}

/** The window's listeners, by event type. */
let listeners: Map<string, (e: Event) => void>;

const fire = (type: string, init: { key?: string; target?: unknown } = {}) => {
  const event = {
    type,
    cancelable: true,
    target: {} as unknown,
    preventDefault: vi.fn(),
    stopImmediatePropagation: vi.fn(),
    ...init,
  };
  listeners.get(type)?.(event as unknown as Event);
  return event;
};
const stopped = (event: ReturnType<typeof fire>) =>
  event.preventDefault.mock.calls.length > 0 &&
  event.stopImmediatePropagation.mock.calls.length > 0;

describe("holdInput", () => {
  beforeEach(() => {
    listeners = new Map();
    vi.stubGlobal("HTMLButtonElement", FakeButton);
    vi.stubGlobal("window", {
      addEventListener: vi.fn((type: string, fn: (e: Event) => void) => listeners.set(type, fn)),
      removeEventListener: vi.fn((type: string) => listeners.delete(type)),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("holds the wheel and a touch's move, before anything else hears them", () => {
    holdInput();
    expect(stopped(fire("wheel"))).toBe(true);
    expect(stopped(fire("touchmove"))).toBe(true);
    expect(window.addEventListener).toHaveBeenCalledWith(
      "wheel",
      expect.any(Function),
      expect.objectContaining({ capture: true, passive: false }),
    );
  });

  it("holds the keys that scroll the page", () => {
    holdInput();
    for (const key of ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "]) {
      expect(stopped(fire("keydown", { key })), key).toBe(true);
    }
  });

  it("lets Space press a button (the switch, above the screen), and Tab, Enter, Escape through", () => {
    holdInput();
    expect(stopped(fire("keydown", { key: " ", target: new FakeButton() }))).toBe(false);
    for (const key of ["Tab", "Enter", "Escape"]) {
      expect(stopped(fire("keydown", { key })), key).toBe(false);
    }
  });

  it("lets go of everything when released", () => {
    const release = holdInput();
    release();
    expect(listeners.size).toBe(0);
    expect(window.removeEventListener).toHaveBeenCalledTimes(3);
  });
});
