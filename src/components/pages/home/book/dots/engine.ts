import type { Dot } from "#/components/pages/home/book/dots/dots.types";

/*
 * The light on the calm book's dots (P27-93). The pointer (or a finger) lights the dots it
 * touches: each one eases brighter, with a faint halo, then fades back once the pointer has
 * gone. A dot's place and size never change: brightness only, so nothing moves in the calm
 * mode (WCAG 2.3.3). Nothing runs while idle: a frame is asked for only while a light changes,
 * and only the area around the lit dots is redrawn.
 */

/** How far the pointer's light reaches (px). */
export const REACH = 50;
/** How quickly a dot lights up, and fades back (s: the time to go about 63% of the way). */
const RISE = 0.06;
const FALL = 0.3;
/** How bright a fully lit dot gets: its opacity goes this far towards 1. */
const LIFT = 0.8;
/** A lit dot's halo: how far it reaches past the dot (px), and its opacity at full light. */
const HALO = 2.5;
const HALO_ALPHA = 0.22;
/** Room around each dot when redrawing an area: its halo, and a little more (px). */
const PAD = 6;
/** The grid's cell (px): the dots are filed by cell, to find the ones near a point fast. */
const CELL = 32;
/** Close enough to its target, a light stops easing. */
const SETTLED = 0.004;

/** A dot and its light now (0–1). */
export type LitDot = Dot & { g: number };

/** An area to redraw: x0, y0, x1, y1. */
export type Box = [number, number, number, number];

/** The pointer, in the field's own px; `null` once it has left. */
export type Pointer = { x: number; y: number } | null;

export type Field = {
  dots: LitDot[];
  grid: Map<number, LitDot[]>;
  /** The dots with some light, or about to get some. */
  lit: Set<LitDot>;
};

const cellKey = (gx: number, gy: number) => gx * 4096 + gy;

export function createField(dots: readonly Dot[]): Field {
  const field: Field = { dots: [], grid: new Map(), lit: new Set() };
  for (const dot of dots) {
    const d = { ...dot, g: 0 };
    field.dots.push(d);
    const key = cellKey(Math.floor(d.x / CELL), Math.floor(d.y / CELL));
    const cell = field.grid.get(key);
    if (cell) cell.push(d);
    else field.grid.set(key, [d]);
  }
  return field;
}

/** The dots filed in the cells under an area. */
function* within(field: Field, [x0, y0, x1, y1]: Box) {
  for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++) {
    for (let gy = Math.floor(y0 / CELL); gy <= Math.floor(y1 / CELL); gy++) {
      yield* field.grid.get(cellKey(gx, gy)) ?? [];
    }
  }
}

/** How lit a dot is at that distance from the pointer: full under it, none at REACH. */
export const lightAt = (dist: number) => (dist >= REACH ? 0 : (1 - (dist / REACH) ** 2) ** 2);

/**
 * One frame of the light, `dt` seconds after the last: the dots near the pointer ease towards
 * their light, the others fade back. Returns the area to redraw (`null`: nothing changed) and
 * whether a light is still changing (ask for another frame).
 */
export function stepLight(
  field: Field,
  pointer: Pointer,
  dt: number,
): { dirty: Box | null; busy: boolean } {
  if (pointer) {
    const area: Box = [pointer.x - REACH, pointer.y - REACH, pointer.x + REACH, pointer.y + REACH];
    for (const d of within(field, area)) {
      if (Math.hypot(d.x - pointer.x, d.y - pointer.y) < REACH) field.lit.add(d);
    }
  }

  let box: Box | null = null;
  let busy = false;
  for (const d of field.lit) {
    const target = pointer ? lightAt(Math.hypot(d.x - pointer.x, d.y - pointer.y)) : 0;
    if (d.g === target) {
      if (target === 0) field.lit.delete(d);
      continue;
    }
    const ease = 1 - Math.exp(-dt / (target > d.g ? RISE : FALL));
    d.g += (target - d.g) * ease;
    if (Math.abs(target - d.g) < SETTLED) d.g = target;
    else busy = true;
    box = box
      ? [Math.min(box[0], d.x), Math.min(box[1], d.y), Math.max(box[2], d.x), Math.max(box[3], d.y)]
      : [d.x, d.y, d.x, d.y];
    if (d.g === 0) field.lit.delete(d);
  }

  // The dots stay put: what changed is just around the dots whose light changed.
  const dirty: Box | null = box && [box[0] - PAD, box[1] - PAD, box[2] + PAD, box[3] + PAD];
  return { dirty, busy };
}

/** One dot as it is now: brighter and haloed as it's lit. */
function paintDot(ctx: CanvasRenderingContext2D, d: LitDot) {
  ctx.fillStyle = d.c;
  if (d.g > 0) {
    ctx.globalAlpha = HALO_ALPHA * d.g;
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r + HALO, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = d.a + (1 - d.a) * LIFT * d.g;
  ctx.beginPath();
  ctx.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
  ctx.fill();
}

/** Every dot, on a cleared canvas (`w` × `h` CSS px). */
export function paintAll(ctx: CanvasRenderingContext2D, field: Field, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  for (const d of field.dots) paintDot(ctx, d);
  ctx.globalAlpha = 1;
}

/** Redraws an area from scratch: cleared, then every dot that reaches into it. */
export function paintArea(ctx: CanvasRenderingContext2D, field: Field, [x0, y0, x1, y1]: Box) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, x1 - x0, y1 - y0);
  ctx.clip();
  ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
  for (const d of within(field, [x0 - PAD, y0 - PAD, x1 + PAD, y1 + PAD])) paintDot(ctx, d);
  ctx.restore();
}
