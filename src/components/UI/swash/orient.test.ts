import { describe, expect, it } from "vitest";
import { orientPath } from "./orient";
import { SWASHES, SWASH_BOX_WIDTH } from "./shapes";

const box = { viewBox: "0 0 300 30", d: "M10 20 C 60 0, 120 30, 170 15 C 210 5, 250 10, 290 25" };
const numbers = (d: string) => (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);

describe("turning a swash", () => {
  it("leaves it as it is unflipped", () => {
    expect(orientPath(box, { flipX: false, flipY: false })).toBe(box.d);
  });

  it("turns it upside down inside its box", () => {
    expect(orientPath(box, { flipX: false, flipY: true })).toBe(
      "M10 10 C 60 30, 120 0, 170 15 C 210 25, 250 20, 290 5",
    );
  });

  it("mirrors it and reverses the stroke, so it still draws from the left", () => {
    // Mirrored, the old end (290, 25) lands at x 10: the new start.
    expect(orientPath(box, { flipX: true, flipY: false })).toBe(
      "M10 25 C 50 10, 90 5, 130 15 C 180 30, 240 0, 290 20",
    );
  });

  it("comes back to the original when turned twice, every shape", () => {
    for (const shape of Object.values(SWASHES)) {
      for (const flip of [{ flipX: true, flipY: false }, { flipX: false, flipY: true }, { flipX: true, flipY: true }]) {
        const twice = orientPath({ viewBox: shape.viewBox, d: orientPath(shape, flip) }, flip);
        const [a, b] = [numbers(twice), numbers(shape.d)];
        expect(a).toHaveLength(b.length);
        a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 0));
      }
    }
  });

  it("keeps every turned shape starting at its left", () => {
    for (const shape of Object.values(SWASHES)) {
      const [x0] = numbers(orientPath(shape, { flipX: true, flipY: true }));
      const width = Number(shape.viewBox.split(" ")[2]);
      expect(x0).toBeLessThan(width / 2);
    }
  });

  it("keeps every shape a single pen stroke in its set's box", () => {
    for (const { length, viewBox, d } of Object.values(SWASHES)) {
      expect(viewBox).toMatch(new RegExp(`^0 0 ${SWASH_BOX_WIDTH[length]} \\d+$`));
      expect(d.match(/M/g)).toHaveLength(1);
    }
  });
});
