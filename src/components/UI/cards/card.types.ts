import type { ButtonHTMLAttributes, ReactNode } from "react";

/** The card's corner: `md` in the full view, `sm` in the side panel and on phones. */
export type GlowCardSize = "md" | "sm";

export interface GlowCardProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  size?: GlowCardSize;
  /** Placement only (margins, column breaks). */
  className?: string;
  /** What the card shows (its image, or its text): clipped to the card's corners. */
  children: ReactNode;
}
