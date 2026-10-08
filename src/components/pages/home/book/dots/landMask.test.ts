import { describe, expect, it } from "vitest";
import { LAND_H, LAND_W, landAt, landGrid } from "#/components/pages/home/book/dots/landMask";

/** A map image (RGBA): dark (land) wherever `land(x, y)` says, white elsewhere. */
const image = (width: number, height: number, land: (x: number, y: number) => boolean) => {
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = land(x, y) ? 0 : 255;
      pixels.set([v, v, v, 255], (y * width + x) * 4);
    }
  }
  return pixels;
};

describe("the land map", () => {
  it("reads one cell per degree from a bigger map", () => {
    // 720 × 360: the western half is land.
    const grid = landGrid(
      image(720, 360, (x) => x < 360),
      720,
      360,
    );
    expect(grid).toHaveLength(LAND_W * LAND_H);
    const isLand = landAt(grid);
    expect(isLand(51.5, -0.13)).toBe(true); // London, just west of the meridian
    expect(isLand(31.6, 8)).toBe(false);
    expect(isLand(0, -179.5)).toBe(true);
    expect(isLand(0, 179.5)).toBe(false);
  });

  it("calls a cell land when most of it is", () => {
    // Land on the top 3 of every 4 rows: 75% of each cell.
    const mostly = landGrid(
      image(360 * 4, 180 * 4, (_x, y) => y % 4 !== 3),
      360 * 4,
      180 * 4,
    );
    expect(mostly.every((v) => v === 1)).toBe(true);
    // Land on 1 of every 4 rows: 25%.
    const little = landGrid(
      image(360 * 4, 180 * 4, (_x, y) => y % 4 === 0),
      360 * 4,
      180 * 4,
    );
    expect(little.every((v) => v === 0)).toBe(true);
  });

  it("keeps the poles and the date line on the map", () => {
    const isLand = landAt(new Uint8Array(LAND_W * LAND_H).fill(1));
    expect(isLand(90, 180)).toBe(true);
    expect(isLand(-90, -180)).toBe(true);
  });
});
