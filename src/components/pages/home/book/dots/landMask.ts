/** The land grid: one cell per degree of longitude and latitude. */
export const LAND_W = 360;
export const LAND_H = 180;
/** The site's land map, the 3D Earth's too (three.js/earth/config.ts `maskUrl`): land is dark. */
export const LAND_MASK_URL = "/textures/earth-land-mask.png";

/** Samples per cell, on each side: a cell is land when most of its 4 × 4 samples are. */
const SAMPLES = 4;

/**
 * The land grid from the map's pixels (RGBA, row by row from 90°N and 180°W): 1 for land.
 * Built the way the prototype's map was (P27-65), so the book's Earth matches it.
 */
export function landGrid(pixels: ArrayLike<number>, width: number, height: number): Uint8Array {
  const grid = new Uint8Array(LAND_W * LAND_H);
  for (let y = 0; y < LAND_H; y++) {
    for (let x = 0; x < LAND_W; x++) {
      let land = 0;
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const px = Math.floor(((x + (sx + 0.5) / SAMPLES) / LAND_W) * width);
          const py = Math.floor(((y + (sy + 0.5) / SAMPLES) / LAND_H) * height);
          if (pixels[(py * width + px) * 4] < 128) land++;
        }
      }
      grid[y * LAND_W + x] = land * 2 >= SAMPLES * SAMPLES ? 1 : 0;
    }
  }
  return grid;
}

/** Whether a point (degrees) is land, on that grid. */
export const landAt = (grid: Uint8Array) => (lat: number, lon: number) => {
  const x = Math.min(LAND_W - 1, Math.max(0, Math.floor(lon + 180)));
  const y = Math.min(LAND_H - 1, Math.max(0, Math.floor(90 - lat)));
  return grid[y * LAND_W + x] === 1;
};

let land: Promise<(lat: number, lon: number) => boolean> | null = null;

/**
 * Loads the land map once (in the browser): drawn on a canvas, its pixels read into the grid.
 * If it can't load, the Earth is drawn all ocean rather than not at all.
 */
export function loadLand() {
  land ??= new Promise((resolve) => {
    const ocean = () => resolve(() => false);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return ocean();
      ctx.drawImage(image, 0, 0);
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      resolve(landAt(landGrid(data, canvas.width, canvas.height)));
    };
    image.onerror = ocean;
    image.src = LAND_MASK_URL;
  });
  return land;
}
