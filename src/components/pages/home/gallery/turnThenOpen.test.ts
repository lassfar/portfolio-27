import { afterEach, describe, expect, it, vi } from "vitest";
import { pinHover, pinScreen, pinTurn } from "#/components/three.js/earth/pinScreen";
import { TURN_MS, turnThenOpen } from "./turnThenOpen";

/** A clock and a frame queue the test steps by hand. */
function fakeFrames() {
  let time = 0;
  let queue: (() => void)[] = [];
  return {
    frame: (step: () => void) => queue.push(step),
    now: () => time,
    /** Advances one frame of `ms`. */
    tick(ms = 16) {
      time += ms;
      const steps = queue;
      queue = [];
      steps.forEach((step) => step());
    },
  };
}

afterEach(() => {
  delete pinScreen.london;
  pinTurn.id = null;
  pinHover.id = null;
});

describe("turnThenOpen", () => {
  it("turns the place round and holds it lit, then opens it once its pin is in front", () => {
    const frames = fakeFrames();
    const open = vi.fn();
    pinScreen.london = { x: 0, y: 0, shown: false, near: true };
    turnThenOpen("london", { ...frames, open });
    expect(pinTurn.id).toBe("london");
    expect(pinHover.id).toBe("london");
    frames.tick();
    frames.tick();
    expect(open).not.toHaveBeenCalled();
    pinScreen.london.shown = true;
    frames.tick();
    expect(open).toHaveBeenCalledWith("london");
    expect(pinHover.id).toBeNull();
  });

  it("opens it anyway if the turn takes too long", () => {
    const frames = fakeFrames();
    const open = vi.fn();
    pinScreen.london = { x: 0, y: 0, shown: false, near: true };
    turnThenOpen("london", { ...frames, open });
    frames.tick(TURN_MS / 2);
    expect(open).not.toHaveBeenCalled();
    frames.tick(TURN_MS);
    expect(open).toHaveBeenCalledOnce();
  });
});
