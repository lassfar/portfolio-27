import { describe, expect, it } from "vitest";
import { LAB_FRAME, LAB_SUN } from "#/components/pages/home/book/dots/shapes/sun";
import { DEG } from "#/components/pages/home/book/dots/patterns";
import { PERIHELIA, closest, loops, probe } from "#/components/pages/home/book/drawings/parker";

/** A point of a loop, at its ellipse's angle t, turned about the Sun as drawn. */
const pointOf = (loop: ReturnType<typeof loops>[number], t: number) => {
  const x = loop.cx + loop.rx * Math.cos(t) - LAB_SUN.x;
  const y = loop.cy + loop.ry * Math.sin(t) - LAB_SUN.y;
  const r = loop.turn * DEG;
  return {
    x: LAB_SUN.x + x * Math.cos(r) - y * Math.sin(r),
    y: LAB_SUN.y + x * Math.sin(r) + y * Math.cos(r),
  };
};

const fromSun = (p: { x: number; y: number }) => Math.hypot(p.x - LAB_SUN.x, p.y - LAB_SUN.y);

describe("the Lab's drawing", () => {
  it("draws each loop around the Sun, each one passing a little closer", () => {
    const all = loops();
    expect(all).toHaveLength(PERIHELIA.length);
    all.forEach((loop, j) => {
      // Its closest pass (the ellipse's near end) is the perihelion, from the Sun.
      expect(fromSun(pointOf(loop, Math.PI))).toBeCloseTo(PERIHELIA[j], 6);
      if (j > 0) expect(PERIHELIA[j]).toBeLessThan(PERIHELIA[j - 1]);
    });
    expect(all.map((l) => l.newest)).toEqual([false, false, false, true]);
  });

  it("marks the newest loop's closest pass, outside the Sun", () => {
    const point = closest();
    expect(fromSun(point)).toBeCloseTo(PERIHELIA[PERIHELIA.length - 1], 6);
    expect(fromSun(point)).toBeGreaterThan(LAB_SUN.r);
  });

  it("puts the probe on the newest loop, in the frame, its shield facing the Sun", () => {
    const at = probe();
    const newest = loops()[PERIHELIA.length - 1];
    const onLoop = Math.min(
      ...Array.from({ length: 3600 }, (_, i) => {
        const p = pointOf(newest, (i / 3600) * 2 * Math.PI);
        return Math.hypot(p.x - at.x, p.y - at.y);
      }),
    );
    expect(onLoop).toBeLessThan(0.5);
    expect(at.x).toBeGreaterThan(0);
    expect(at.x).toBeLessThan(LAB_FRAME.w);
    expect(at.y).toBeGreaterThan(0);
    expect(at.y).toBeLessThan(LAB_FRAME.h);
    // The shield is the probe's local "up" (−y): turned by `turn`, it points at the Sun.
    const r = at.turn * DEG;
    const up = { x: Math.sin(r), y: -Math.cos(r) };
    const toSun = { x: LAB_SUN.x - at.x, y: LAB_SUN.y - at.y };
    const cos = (up.x * toSun.x + up.y * toSun.y) / Math.hypot(toSun.x, toSun.y);
    expect(cos).toBeCloseTo(1, 6);
  });
});
