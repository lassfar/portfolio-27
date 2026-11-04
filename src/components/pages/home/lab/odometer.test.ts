import { describe, expect, it } from "vitest";
import { DRUMS, odometerDigits } from "./odometer";

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
