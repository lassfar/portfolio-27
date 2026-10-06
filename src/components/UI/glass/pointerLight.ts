import type { PointerEvent } from "react";

/**
 * Moves an element's liquid-glass light to the pointer (P27-80): sets `--mx` / `--my`,
 * read by the `liquid` utility (globals.css) and the cards' glow (UI/cards/GlowCard).
 * In the element's own px — its layout size, so a hover `scale` doesn't shift the light.
 * Touch has no hover: skipped. Use as `onPointerMove`.
 */
export function pointerLight(e: PointerEvent<HTMLElement>) {
  if (e.pointerType === "touch") return;
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const k = r.width > 0 ? el.offsetWidth / r.width : 1;
  el.style.setProperty("--mx", `${(e.clientX - r.left) * k}px`);
  el.style.setProperty("--my", `${(e.clientY - r.top) * k}px`);
}
