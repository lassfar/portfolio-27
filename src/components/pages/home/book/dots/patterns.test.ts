import { describe, expect, it } from "vitest";
import type { Pen } from "#/components/pages/home/book/dots/dots.types";
import { disc, discCount, hash, seeded, sky } from "#/components/pages/home/book/dots/patterns";

/** A pen that keeps the dots' places. */
const recorder = () => {
  const dots: { x: number; y: number }[] = [];
  const pen: Pen = { dot: (x, y) => dots.push({ x, y }), mark: () => {} };
  return { dots, pen };
};

describe("the dot patterns", () => {
  it("draws the same thing for the same seed, and something else for another", () => {
    const a = seeded(hash("saturn"));
    const b = seeded(hash("saturn"));
    const c = seeded(hash("earth"));
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect([c(), c(), c()]).not.toEqual(first);
    first.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    first.forEach((v) => expect(v).toBeLessThan(1));
  });

  it("spreads a disc's dots evenly, about 5.5 px apart", () => {
    const R = 120;
    const { dots, pen } = recorder();
    disc(pen, 0, 0, R, discCount(R), () => ({ r: 1, c: "#fff", a: 1 }));
    expect(dots).toHaveLength(discCount(R));
    // Each dot's nearest neighbour, for the dots away from the rim.
    const inner = dots.filter((d) => Math.hypot(d.x, d.y) < R * 0.8);
    const nearest = inner.map((d) =>
      Math.min(...dots.filter((o) => o !== d).map((o) => Math.hypot(o.x - d.x, o.y - d.y))),
    );
    const mean = nearest.reduce((s, v) => s + v, 0) / nearest.length;
    expect(mean).toBeGreaterThan(4.5);
    expect(mean).toBeLessThan(6.5);
    expect(Math.min(...nearest)).toBeGreaterThan(2.5);
  });

  it("leaves out the spots a style skips", () => {
    const { dots, pen } = recorder();
    disc(pen, 0, 0, 50, 200, (_x, _y, t) => (t < 0.5 ? null : { r: 1, c: "#fff", a: 1 }));
    expect(dots.length).toBeGreaterThan(0);
    expect(dots.length).toBeLessThan(200);
    dots.forEach((d) => expect(Math.hypot(d.x, d.y)).toBeGreaterThanOrEqual(25 - 1e-9));
  });

  it("keeps the sky inside its canvas", () => {
    const { dots, pen } = recorder();
    sky(pen, 400, 300, seeded(1));
    expect(dots.length).toBeGreaterThan(0);
    dots.forEach((d) => {
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThanOrEqual(400);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThanOrEqual(300);
    });
  });
});
