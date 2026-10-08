import type { Shape } from "#/components/pages/home/book/dots/dots.types";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import {
  BLUE,
  DEG,
  LIGHT_BLUE,
  LIGHT_PEACH,
  PEACH,
  SLATE,
  disc,
  discCount,
  sky,
} from "#/components/pages/home/book/dots/patterns";

/** The globe turned towards the places: its centre (degrees). */
const LAT0 = 30 * DEG;
const LON0 = -6 * DEG;

/**
 * Which way each place's label leans from its pin (x, y; y down), so the three close places
 * don't overlap. A new place leans up and to the right.
 */
const LEAN: Record<string, readonly [number, number]> = {
  london: [1, -1],
  brockenhurst: [-1.2, -0.7],
  morocco: [-1.2, 0.5],
};

/** A point on the globe (radians), seen from the front: x right, y up, z towards the viewer. */
const project = (lat: number, lon: number) => {
  const cl = Math.cos(lat);
  const dl = lon - LON0;
  return {
    x: cl * Math.sin(dl),
    y: Math.cos(LAT0) * Math.sin(lat) - Math.sin(LAT0) * cl * Math.cos(dl),
  };
};

/**
 * The Earth: the real land map (the site's earth-land-mask.png), turned towards the places,
 * lit like Saturn (brightest up and to the left). One even disc of dots on the screen, each
 * looked up on the globe behind it; a faint blue rim, a small moon, and a pin on each place.
 */
export const earth: Shape = (pen, { w, h, rnd, isLand }) => {
  sky(pen, w, h, rnd, 0.8);
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.4;

  disc(pen, cx, cy, R, discCount(R), (x, y) => {
    const nx = (x - cx) / R;
    const ny = -(y - cy) / R;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const lat = Math.asin(Math.max(-1, Math.min(1, ny * Math.cos(LAT0) + nz * Math.sin(LAT0))));
    let lon = LON0 + Math.atan2(nx, nz * Math.cos(LAT0) - ny * Math.sin(LAT0));
    if (lon > Math.PI) lon -= 2 * Math.PI;
    if (lon < -Math.PI) lon += 2 * Math.PI;
    const light = Math.min(1, Math.max(0, -nx * 0.45 + ny * 0.55 + nz * 0.75));
    return isLand(lat / DEG, lon / DEG)
      ? { r: 1.55, c: PEACH, a: 0.2 + 0.8 * light }
      : { r: 1.15, c: BLUE, a: 0.08 + 0.34 * light };
  });

  const rim = Math.round((2 * Math.PI * R) / 5.2);
  for (let i = 0; i < rim; i++) {
    const a = (i / rim) * 2 * Math.PI;
    pen.dot(cx + Math.cos(a) * R, cy + Math.sin(a) * R, 1, LIGHT_BLUE, 0.3);
  }

  const mx = cx - R * 1.22;
  const my = cy - R * 0.78;
  const mr = R * 0.085;
  disc(pen, mx, my, mr, 70, (x, y) => ({
    r: 0.9,
    c: SLATE,
    a: 0.25 + 0.6 * Math.max(0, (-(x - mx) / mr) * 0.5 - ((y - my) / mr) * 0.5 + 0.5),
  }));

  const reach = Math.max(16, Math.min(40, R * 0.16));
  for (const place of PHOTO_LOCATIONS) {
    const [dx, dy] = LEAN[place.id] ?? [1, -1];
    const q = project(place.lat * DEG, place.lng * DEG);
    const x = cx + q.x * R;
    const y = cy - q.y * R;
    const ex = x + dx * reach;
    const ey = y + dy * reach;
    pen.dot(x, y, 2, LIGHT_PEACH, 1);
    pen.mark({ kind: "ring", x, y, r: 5.5 });
    pen.mark({ kind: "line", x1: x + dx * 5, y1: y + dy * 4, x2: ex, y2: ey });
    pen.mark({
      kind: "label",
      x: ex + dx * 5,
      y: ey + 4,
      text: place.short ?? place.place,
      anchor: dx > 0 ? "start" : "end",
    });
  }
};
