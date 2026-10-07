import type { PointerEvent } from "react";
import { isCalm } from "#/stores/useMotion";

/**
 * Moves an element's liquid-glass light to the pointer (P27-80): sets `--mx` / `--my`,
 * read by the `liquid` utility (globals.css) and the cards' glow (UI/cards/GlowCard).
 * In the element's own px — its layout size, so a hover `scale` doesn't shift the light.
 * Touch has no hover: skipped. In calm motion it doesn't follow: the light rests at its
 * default spot, even if it moved before calm was chosen (P27-92). Use as `onPointerMove`.
 */
export function pointerLight(e: PointerEvent<HTMLElement>) {
  if (e.pointerType === "touch") return;
  const el = e.currentTarget;
  if (isCalm()) {
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
    return;
  }
  const r = el.getBoundingClientRect();
  const k = r.width > 0 ? el.offsetWidth / r.width : 1;
  el.style.setProperty("--mx", `${(e.clientX - r.left) * k}px`);
  el.style.setProperty("--my", `${(e.clientY - r.top) * k}px`);
}
