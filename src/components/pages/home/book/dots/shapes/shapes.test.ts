import { describe, expect, it } from "vitest";
import type { Dot, DotMark, ShapeName } from "#/components/pages/home/book/dots/dots.types";
import { SHAPE_NAMES } from "#/components/pages/home/book/dots/dots.types";
import { BLUE, LIGHT_BLUE, hash, seeded } from "#/components/pages/home/book/dots/patterns";
import { SHAPES } from "#/components/pages/home/book/dots/shapes";
import { BOOK } from "#/components/pages/home/story/copy";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";

/** A rough land map for the tests: land west of the meridian, between 0° and 60°N. */
const isLand = (lat: number, lon: number) => lat > 0 && lat < 60 && lon < 0;

/** Each figure's size in the book: the cover's star fills a screen; the others are 5:4 figures. */
const SIZE: Record<ShapeName, { w: number; h: number }> = {
  star: { w: 1440, h: 900 },
  saturn: { w: 600, h: 480 },
  earth: { w: 600, h: 480 },
  sun: { w: 600, h: 480 },
  galaxy: { w: 600, h: 480 },
};

const draw = (name: ShapeName, size = SIZE[name]) => {
  const dots: Dot[] = [];
  const marks: DotMark[] = [];
  SHAPES[name](
    { dot: (x, y, r, c, a) => dots.push({ x, y, r, c, a }), mark: (m) => marks.push(m) },
    { ...size, rnd: seeded(hash(name)), viewportHeight: size.h, isLand },
  );
  return { dots, marks };
};

const labels = (marks: DotMark[]) => marks.flatMap((m) => (m.kind === "label" ? [m.text] : []));

describe("the calm book's dotted shapes", () => {
  it.each(SHAPE_NAMES)("draws %s the same way every time", (name) => {
    expect(draw(name)).toEqual(draw(name));
  });

  it.each(SHAPE_NAMES)("keeps %s inside its figure, its dots visible", (name) => {
    const { w, h } = SIZE[name];
    const { dots } = draw(name);
    expect(dots.length).toBeGreaterThan(500);
    dots.forEach((d) => {
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThanOrEqual(w);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThanOrEqual(h);
      expect(d.r).toBeGreaterThan(0);
      expect(d.a).toBeGreaterThanOrEqual(0);
      expect(d.a).toBeLessThanOrEqual(1);
    });
  });

  it("gives the star no blue", () => {
    const colours = new Set(draw("star").dots.map((d) => d.c));
    expect(colours.has(BLUE)).toBe(false);
    expect(colours.has(LIGHT_BLUE)).toBe(false);
  });

  it("sizes the star from the screen, bigger on a phone", () => {
    const desktop = draw("star", { w: 1440, h: 900 }).dots;
    const phone = draw("star", { w: 390, h: 844 }).dots;
    expect(desktop.length).toBeGreaterThan(phone.length);
  });

  it("pins each place on the Earth, by its short name", () => {
    const { marks } = draw("earth");
    expect(labels(marks)).toEqual(PHOTO_LOCATIONS.map((p) => p.short ?? p.place));
    expect(marks.filter((m) => m.kind === "ring")).toHaveLength(PHOTO_LOCATIONS.length);
  });

  it("draws the Earth's land from the map", () => {
    const { dots } = draw("earth");
    const land = dots.filter((d) => d.r === 1.55);
    const ocean = dots.filter((d) => d.r === 1.15);
    expect(land.length).toBeGreaterThan(100);
    expect(ocean.length).toBeGreaterThan(100);
  });

  it("marks one dot of the Milky Way: you", () => {
    expect(labels(draw("galaxy").marks)).toEqual([BOOK.youAreHere]);
  });

  it("puts the Lab's Sun in the drawing's frame, whatever the figure's shape", () => {
    const wide = draw("sun", { w: 800, h: 400 }).dots;
    const xs = wide.map((d) => d.x);
    // 800 × 400 fits the 500 × 400 frame at scale 1, centred: the Sun stays left of the middle.
    expect(Math.max(...xs)).toBeLessThan(400);
    expect(Math.min(...xs)).toBeGreaterThan(150);
  });
});
