import { loadOnce } from "#/components/hooks/loadOnce";

/*
 * The calm book's figures' code, each from one import site (P27-95): the figures'
 * `next/dynamic` and the preload share it, so the build makes one chunk each.
 */
export const loadDotCanvas = loadOnce(() => import("#/components/pages/home/book/dots/DotCanvas"));
export const loadCraftDrawing = loadOnce(
  () => import("#/components/pages/home/book/drawings/CraftDrawing"),
);
export const loadParkerDrawing = loadOnce(
  () => import("#/components/pages/home/book/drawings/ParkerDrawing"),
);

/** Fetches the book's figures' code (P27-94): its dots and drawings, before a switch into calm reveals it. */
export const preloadBook = (): Promise<unknown> =>
  Promise.all([loadDotCanvas(), loadCraftDrawing(), loadParkerDrawing()]);
