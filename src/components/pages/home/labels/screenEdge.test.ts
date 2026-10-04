import { describe, expect, it } from "vitest";
import { LABEL_EDGE, keepOnScreen } from "./screenEdge";

const VW = 390;

describe("keeping a label on screen", () => {
  it("leaves a label already inside where it is", () => {
    expect(keepOnScreen(100, 80, 140, VW)).toBe(100);
  });

  it("moves a label in from either edge", () => {
    expect(keepOnScreen(-30, 120, 20, VW)).toBe(LABEL_EDGE); // centred on a point near the left edge
    expect(keepOnScreen(330, 120, 380, VW)).toBe(VW - 120 - LABEL_EDGE); // …near the right edge
  });

  it("never leaves the point it names: an off-screen point takes its label with it", () => {
    expect(keepOnScreen(-200, 120, -150, VW)).toBe(-150); // off the left: its left edge stays on the point
    expect(keepOnScreen(500, 120, 560, VW)).toBe(560 - 120); // off the right: its right edge stays on the point
  });

  it("moves smoothly as its point nears the edge (no snap)", () => {
    let last = keepOnScreen(-60, 120, 0, VW);
    for (let x = 0.5; x <= 80; x += 0.5) {
      const left = keepOnScreen(x - 60, 120, x, VW);
      expect(Math.abs(left - last)).toBeLessThanOrEqual(0.5 + 1e-9);
      last = left;
    }
  });
});
