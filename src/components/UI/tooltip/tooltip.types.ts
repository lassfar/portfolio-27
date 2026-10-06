import type { ReactNode } from "react";

export const TOOLTIP_SIDES = ["above", "below", "left", "right"] as const;
/** Which side of its trigger it opens on (it slides in from there). */
export type TooltipSide = (typeof TOOLTIP_SIDES)[number];

export const TOOLTIP_ALIGNS = ["start", "center", "end"] as const;
/** Along its trigger, above or below it: flush with its start or end edge, or centred. */
export type TooltipAlign = (typeof TOOLTIP_ALIGNS)[number];

export interface TooltipProps {
  children: ReactNode;
  side?: TooltipSide;
  align?: TooltipAlign;
  /**
   * Shown or hidden from outside (e.g. a toast). Left out, it shows while its trigger — the
   * element marked `group/tip` around it — is hovered or keyboard-focused.
   */
  open?: boolean;
  /** Shows after a short hover (0.8s), so a passing pointer doesn't flash it; hides at once. */
  delayed?: boolean;
  /**
   * Read out as its text changes (a toast). Otherwise it's hidden from screen readers: it
   * repeats its trigger's name.
   */
  live?: boolean;
}
