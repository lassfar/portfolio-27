/**
 * A scene label's anchoring: fixed to the screen's corner and moved onto its point by an
 * inline `transform` every frame (its overlay's `update`), hidden until it's shown
 * (`showAnchored`; its overlay owns its pointer events). Over the story's overlays (z-45),
 * under the panel (z-50).
 */
export const ANCHORED =
  "fixed left-0 top-0 z-45 pointer-events-none opacity-0 invisible will-change-[transform,opacity]";

/** A label's fade (the `liquid` and QuietLabel opacity transitions, ms). */
const FADE_MS = 300;
const hiding = new WeakMap<HTMLElement, number>();

/**
 * Fades an anchored label in or out, and once it has faded out, takes it out of the page
 * (`visibility`, P27-86): a hidden glass label's blur was still drawn at opacity 0, every frame.
 */
export function showAnchored(el: HTMLElement, shown: boolean) {
  window.clearTimeout(hiding.get(el));
  el.style.opacity = shown ? "1" : "0";
  if (shown) el.style.visibility = "visible";
  else hiding.set(el, window.setTimeout(() => (el.style.visibility = "hidden"), FADE_MS));
}
