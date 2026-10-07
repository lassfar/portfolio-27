import { describe, expect, it } from "vitest";
import { PORTRAIT_FIT, fitRamp, portraitFit, spanOf } from "./portraitFit";

const FOV = 55;
const PHONES = [390 / 844, 375 / 667, 360 / 740];

describe("the portrait fit", () => {
  it("leaves every landscape or square screen exactly as designed", () => {
    for (const aspect of [1, 4 / 3, 1.6, 16 / 9, 2.4, NaN]) {
      for (const span of [0.5, 1, 2.5]) expect(portraitFit(aspect, span)).toBe(1);
    }
  });

  it("fits a subject's whole width on a phone held upright", () => {
    for (const aspect of PHONES) {
      for (const span of [0.8, 1, 1.18]) {
        const k = portraitFit(aspect, span);
        expect(span / (aspect * k)).toBeCloseTo(1, 10); // exactly one screen width
      }
    }
  });

  it("never steps closer, and needs nothing for a subject that already fits", () => {
    expect(portraitFit(0.5, 0.4)).toBe(1);
    for (const aspect of [0.4, 0.6, 0.75, 0.9, 0.99])
      expect(portraitFit(aspect, 1.2)).toBeGreaterThanOrEqual(1);
  });

  it("eases in as the screen turns, with no jump at square", () => {
    const span = 1.18; // wider than the screen's height: the case that would jump
    expect(portraitFit(1 - 1e-6, span)).toBeCloseTo(1, 5);
    let last = Infinity;
    for (let aspect = 0.4; aspect <= 1; aspect += 0.01) {
      const k = portraitFit(aspect, span);
      expect(k).toBeLessThanOrEqual(last + 1e-12); // farther the narrower the screen
      last = k;
    }
    expect(portraitFit(PORTRAIT_FIT.fullAt, span)).toBeCloseTo(span / PORTRAIT_FIT.fullAt, 10);
  });

  it("measures a subject's span from its size and distance", () => {
    const tanHalf = Math.tan((FOV * Math.PI) / 360);
    expect(spanOf(tanHalf, FOV)).toBeCloseTo(1, 12); // as wide as the screen is tall
    expect(spanOf(tanHalf / 2, FOV, 1.1)).toBeCloseTo(0.55, 12);
  });

  it("ramps a fit in from exactly 1", () => {
    expect(fitRamp(1, 0.37)).toBe(1);
    expect(fitRamp(2, 0)).toBe(1);
    expect(fitRamp(2, 1)).toBe(2);
    expect(fitRamp(2, 0.5)).toBe(1.5);
  });
});
