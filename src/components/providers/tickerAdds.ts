import gsap from "gsap";

/** GSAP's ticker, with the list of its listeners (internal: none if it's ever renamed). */
const ticker = gsap.ticker as typeof gsap.ticker & { _listeners?: gsap.TickerCallback[] };

/**
 * Runs `create` and gives back the undo of what it added to GSAP's ticker (P27-95). On iOS,
 * ScrollSmoother's normalizeScroll adds a listener its `kill()` never removes, so the ticker
 * never sleeps again once the journey has gone: the undo removes it.
 */
export function tickerAdds(create: () => void): () => void {
  const before = new Set(ticker._listeners ?? []);
  create();
  const added = (ticker._listeners ?? []).filter((listener) => !before.has(listener));
  return () => added.forEach((listener) => gsap.ticker.remove(listener));
}
