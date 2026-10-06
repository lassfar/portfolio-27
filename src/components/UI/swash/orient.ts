import type { SwashName, SwashShape } from "./shapes";

/** A swash's orientation: mirrored left ⇄ right, and/or upside down. */
export type SwashFlip = { flipX: boolean; flipY: boolean };

/** A swash as a title wears it: a shape, maybe turned. Spread it on a Swash. */
export type SwashPick = { shape: SwashName } & SwashFlip;

const fmt = (v: number) => String(Math.round(v * 10) / 10);

/**
 * A swash turned (P27-83): mirrored and/or upside down, inside its own box. Mirrored, its
 * stroke is also reversed, so it still draws from the left — like the text above it.
 * Expects the shapes' path form: `M x y` then `C x y, x y, x y` curves.
 */
export function orientPath({ viewBox, d }: Pick<SwashShape, "viewBox" | "d">, { flipX, flipY }: SwashFlip): string {
  if (!flipX && !flipY) return d;
  const [, , width, height] = viewBox.split(" ").map(Number);
  const n = (d.match(/-?\d*\.?\d+/g) ?? []).map(Number);
  const pts: [number, number][] = [];
  for (let i = 0; i + 1 < n.length; i += 2) {
    pts.push([flipX ? width - n[i] : n[i], flipY ? height - n[i + 1] : n[i + 1]]);
  }
  // pts: start, then per curve: control 1, control 2, end.
  const curves: [number, number][][] = [];
  for (let i = 1; i + 2 < pts.length; i += 3) curves.push([pts[i], pts[i + 1], pts[i + 2]]);
  let start = pts[0];
  if (flipX) {
    // Reversed: the old end is the new start; each curve runs back, its controls swapped.
    const ends = [pts[0], ...curves.map((c) => c[2])];
    start = ends[ends.length - 1];
    curves.reverse();
    for (let k = 0; k < curves.length; k++) {
      const [c1, c2] = curves[k];
      curves[k] = [c2, c1, ends[ends.length - 2 - k]];
    }
  }
  const p = ([x, y]: [number, number]) => `${fmt(x)} ${fmt(y)}`;
  return `M${p(start)}${curves.map(([c1, c2, e]) => ` C ${p(c1)}, ${p(c2)}, ${p(e)}`).join("")}`;
}
