import { describe, expect, it } from "vitest";
import { sheetRelease } from "./sheet";

describe("sheetRelease", () => {
  it("closes past a quarter of the sheet (80 px at least)", () => {
    expect(sheetRelease(130, 0, 500)).toBe("close");
    expect(sheetRelease(120, 0, 500)).toBe("back");
    expect(sheetRelease(80, 0, 200)).toBe("close");
    expect(sheetRelease(70, 0, 200)).toBe("back");
  });

  it("closes on a flick down, not on a twitch", () => {
    expect(sheetRelease(40, 0.8, 500)).toBe("close");
    expect(sheetRelease(10, 0.8, 500)).toBe("back");
    expect(sheetRelease(40, 0.2, 500)).toBe("back");
  });
});
