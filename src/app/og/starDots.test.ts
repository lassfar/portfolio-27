import { describe, expect, it } from "vitest";
import { dotsIn, starDots } from "./starDots";

describe("the Apple icon's star", () => {
  it("is the book's star, the same dots every time, its sky over the whole picture", () => {
    const a = starDots(1200, 630);
    expect(a).toEqual(starDots(1200, 630));
    expect(a.dots.length).toBeGreaterThan(1000);
    expect(a.cx).toBe(600);
    expect(Math.max(...a.dots.map((d) => d.y))).toBeGreaterThan(560); // sky down to the words
  });

  it("crops to the dots inside a view", () => {
    const { dots, cx, cy, A } = starDots(1200, 630);
    const view = [cx - A, cy - A, 2 * A, 2 * A];
    const inside = dotsIn(dots, view);
    expect(inside.length).toBeLessThan(dots.length);
    inside.forEach((d) => {
      expect(d.x + d.r).toBeGreaterThanOrEqual(view[0]);
      expect(d.x - d.r).toBeLessThanOrEqual(view[0] + view[2]);
    });
  });
});
