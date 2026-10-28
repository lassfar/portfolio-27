import type { Dot } from "#/components/pages/home/book/dots/dots.types";
import { hash, seeded } from "#/components/pages/home/book/dots/patterns";
import { star, starLayout } from "#/components/pages/home/book/dots/shapes/star";

/**
 * The calm book's dotted star (its cover's) for a picture of `w`×`h` px, laid out as on a
 * `viewportHeight` screen: its dots (the faint sky over the whole picture), its centre and its
 * size. The book's seed, so it's the site's own star, dot for dot (P27-98).
 */
export function starDots(w: number, h: number, viewportHeight = h) {
  const dots: Dot[] = [];
  star(
    { dot: (x, y, r, c, a) => dots.push({ x, y, r, c, a }), mark: () => {} },
    { w, h, rnd: seeded(hash("star")), viewportHeight, isLand: () => false },
  );
  return { dots, ...starLayout(w, h, viewportHeight) };
}

/** The dots inside a view (x, y, width, height): what a crop of the picture draws. */
export const dotsIn = (dots: readonly Dot[], [x, y, w, h]: readonly number[]) =>
  dots.filter((d) => d.x + d.r >= x && d.x - d.r <= x + w && d.y + d.r >= y && d.y - d.r <= y + h);
