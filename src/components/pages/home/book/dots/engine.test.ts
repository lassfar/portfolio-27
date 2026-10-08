import { describe, expect, it } from "vitest";
import type { Dot } from "#/components/pages/home/book/dots/dots.types";
import { REACH, createField, lightAt, stepLight } from "#/components/pages/home/book/dots/engine";

/** A row of dots, 5 px apart, along y = 100. */
const row = (): Dot[] =>
  Array.from({ length: 80 }, (_, i) => ({ x: i * 5, y: 100, r: 1.2, c: "#ffa14a", a: 0.4 }));

/** Runs frames of 1/60 s until the light settles (or gives up). */
const settle = (
  field: ReturnType<typeof createField>,
  pointer: { x: number; y: number } | null,
) => {
  for (let i = 0; i < 600; i++) {
    if (!stepLight(field, pointer, 1 / 60).busy) return i + 1;
  }
  return Infinity;
};

describe("the light on the dots", () => {
  it("is full under the pointer and gone at its reach", () => {
    expect(lightAt(0)).toBe(1);
    expect(lightAt(REACH / 2)).toBeGreaterThan(0);
    expect(lightAt(REACH / 2)).toBeLessThan(1);
    expect(lightAt(REACH)).toBe(0);
    expect(lightAt(REACH * 2)).toBe(0);
  });

  it("lights the dots near the pointer, and only those", () => {
    const field = createField(row());
    settle(field, { x: 200, y: 100 });
    const under = field.dots.find((d) => d.x === 200)!;
    const far = field.dots.find((d) => d.x === 300)!;
    expect(under.g).toBeCloseTo(1, 2);
    expect(far.g).toBe(0);
  });

  it("never moves or grows a dot: brightness only (WCAG 2.3.3)", () => {
    const dots = row();
    const field = createField(dots);
    settle(field, { x: 120, y: 102 });
    settle(field, { x: 180, y: 98 });
    field.dots.forEach((d, i) => {
      expect(d.x).toBe(dots[i].x);
      expect(d.y).toBe(dots[i].y);
      expect(d.r).toBe(dots[i].r);
      expect(d.a).toBe(dots[i].a);
    });
  });

  it("fades back to rest once the pointer has gone, then stops asking for frames", () => {
    const field = createField(row());
    settle(field, { x: 200, y: 100 });
    const frames = settle(field, null);
    expect(frames).toBeLessThan(200);
    expect(field.dots.every((d) => d.g === 0)).toBe(true);
    expect(field.lit.size).toBe(0);
    expect(stepLight(field, null, 1 / 60)).toEqual({ dirty: null, busy: false });
  });

  it("redraws only around the dots whose light changed", () => {
    const field = createField(row());
    const { dirty } = stepLight(field, { x: 200, y: 100 }, 1 / 60);
    expect(dirty).not.toBeNull();
    const [x0, y0, x1, y1] = dirty!;
    expect(x0).toBeGreaterThan(200 - REACH - 10);
    expect(x1).toBeLessThan(200 + REACH + 10);
    expect(y0).toBeGreaterThan(80);
    expect(y1).toBeLessThan(120);
  });

  it("rests while a still pointer's light has settled", () => {
    const field = createField(row());
    settle(field, { x: 200, y: 100 });
    expect(stepLight(field, { x: 200, y: 100 }, 1 / 60)).toEqual({ dirty: null, busy: false });
  });
});
