import { describe, expect, it } from "vitest";
import { DAMPING, damp } from "./utils";

/** Ease from 0 toward 1 for `seconds` at `fps`. */
function run(fps: number, seconds: number, factor: number) {
  let value = 0;
  for (let i = 0; i < Math.round(seconds * fps); i++) value = damp(value, 1, factor, 1 / fps);
  return value;
}

describe("damp (time-based)", () => {
  it("closes exactly `factor` of the gap per frame at the reference frame rate", () => {
    expect(damp(0, 1, 0.1, 1 / DAMPING.referenceFps)).toBeCloseTo(0.1, 12);
  });

  it("reaches the same point after the same time, at any frame rate", () => {
    const atReference = run(DAMPING.referenceFps, 1, 0.05);
    for (const fps of [30, 60, 120, 144]) {
      expect(run(fps, 1, 0.05)).toBeCloseTo(atReference, 9);
    }
  });

  it("never overshoots, even after a long frame", () => {
    expect(damp(0, 1, 0.2, 5)).toBeLessThanOrEqual(1);
    expect(damp(0, 1, 0.2, 0)).toBe(0);
  });
});
