import type { Color } from "three";

const lastHex = new WeakMap<Color, string>();

/**
 * `color.set(hex)`, only when `hex` has changed (P27-78). The scene re-applies its
 * live-tunable colours every frame, and parsing a hex string (and converting it to
 * linear) ~100 times a frame adds up. The dev panel edits those strings in place, so
 * comparing them each frame still picks up every change.
 */
export function setHexIfChanged(color: Color, hex: string): void {
  if (lastHex.get(color) === hex) return;
  color.set(hex);
  lastHex.set(color, hex);
}
