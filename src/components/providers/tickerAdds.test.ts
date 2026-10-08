import { describe, expect, it, vi } from "vitest";
import gsap from "gsap";
import { tickerAdds } from "./tickerAdds";

const listeners = () => (gsap.ticker as unknown as { _listeners: unknown[] })._listeners;

describe("tickerAdds", () => {
  it("removes what it added to GSAP's ticker, and only that", () => {
    const before = vi.fn();
    const added = vi.fn();
    gsap.ticker.add(before);
    const undo = tickerAdds(() => gsap.ticker.add(added));
    expect(listeners()).toContain(added);
    undo();
    expect(listeners()).not.toContain(added);
    expect(listeners()).toContain(before);
    gsap.ticker.remove(before);
  });

  it("reads the ticker's list GSAP keeps (so the undo isn't silently empty)", () => {
    expect(Array.isArray(listeners())).toBe(true);
  });
});
