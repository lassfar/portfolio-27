/** The keys that scroll the page. */
const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
]);

/**
 * Holds the scroll input while the modes switch (P27-94): the wheel, a touch's move and the
 * scrolling keys do nothing, so the page stays where it lands behind the transition screen.
 * Space still presses a button (the switch, above the screen); Tab still moves. Returns the
 * release.
 */
export function holdInput(): () => void {
  const stop = (e: Event) => {
    if (e.cancelable) e.preventDefault();
    e.stopImmediatePropagation();
  };
  const key = (e: KeyboardEvent) => {
    if (!SCROLL_KEYS.has(e.key)) return;
    if (e.key === " " && e.target instanceof HTMLButtonElement) return;
    stop(e);
  };
  const options = { capture: true, passive: false };
  window.addEventListener("wheel", stop, options);
  window.addEventListener("touchmove", stop, options);
  window.addEventListener("keydown", key, { capture: true });
  return () => {
    window.removeEventListener("wheel", stop, { capture: true });
    window.removeEventListener("touchmove", stop, { capture: true });
    window.removeEventListener("keydown", key, { capture: true });
  };
}
