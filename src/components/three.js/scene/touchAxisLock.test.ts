import { describe, expect, it } from "vitest";
import { createTouchAxisLock } from "./touchAxisLock";

const touch = (clientX: number, clientY: number) => ({ pointerType: "touch", clientX, clientY });
const mouse = (clientX: number, clientY: number) => ({ pointerType: "mouse", clientX, clientY });

describe("the touch axis lock", () => {
  it("always lets a mouse or a pen drag, as before", () => {
    const lock = createTouchAxisLock();
    lock.start(mouse(100, 100));
    expect(lock.allows(mouse(100, 160))).toBe(true); // straight down
    expect(lock.allows(mouse(160, 100))).toBe(true);
    lock.start({ pointerType: "pen", clientX: 0, clientY: 0 });
    expect(lock.allows({ pointerType: "pen", clientX: 0, clientY: 50 })).toBe(true);
  });

  it("turns on a sideways swipe, for the whole swipe", () => {
    const lock = createTouchAxisLock();
    lock.start(touch(100, 100));
    expect(lock.allows(touch(110, 103))).toBe(true);
    expect(lock.allows(touch(112, 140))).toBe(true); // it may curve: still one swipe
  });

  it("leaves an up/down swipe to the scroll, for the whole swipe", () => {
    const lock = createTouchAxisLock();
    lock.start(touch(100, 100));
    expect(lock.allows(touch(103, 110))).toBe(false);
    expect(lock.allows(touch(160, 112))).toBe(false);
  });

  it("decides on the first move that goes anywhere; a tie scrolls (as GSAP's)", () => {
    const lock = createTouchAxisLock();
    lock.start(touch(100, 100));
    expect(lock.allows(touch(100, 100))).toBe(false); // no move yet: nothing decided
    expect(lock.allows(touch(105, 105))).toBe(false); // diagonal: scroll
  });

  it("decides again for each new swipe", () => {
    const lock = createTouchAxisLock();
    lock.start(touch(0, 0));
    expect(lock.allows(touch(0, 20))).toBe(false);
    lock.start(touch(0, 0));
    expect(lock.allows(touch(20, 0))).toBe(true);
  });
});
