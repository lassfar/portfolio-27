import { describe, expect, it } from "vitest";
import { DRUMS, odometerDigits, stepsReached } from "./odometer";

describe("odometerDigits", () => {
  it("gives each drum its digit", () => {
    expect(odometerDigits("147")).toEqual([1, 4, 7, 0]);
    expect(odometerDigits("24.1")).toEqual([null, 2, 4, 1]);
  });

  it("leaves the leading drums blank", () => {
    expect(odometerDigits("6.1")).toEqual([null, null, 6, 1]);
  });

  it("always fills every drum", () => {
    for (const km of ["147", "99.9", "6.1"]) expect(odometerDigits(km)).toHaveLength(DRUMS);
  });
});

describe("stepsReached", () => {
  const steps = ["24.1", "18.6", "6.1"];

  it("reaches none before the first record", () => {
    expect(stepsReached("147", steps)).toBe(0);
    expect(stepsReached("24.2", steps)).toBe(0);
  });

  it("counts a record as soon as it's met, and those between", () => {
    expect(stepsReached("24.1", steps)).toBe(1);
    expect(stepsReached("20.0", steps)).toBe(1);
    expect(stepsReached("6.1", steps)).toBe(3);
  });
});
