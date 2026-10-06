import type { ButtonHTMLAttributes, ReactNode } from "react";

export const GLOW_CARD_SIZES = ["md", "sm"] as const;
/** The card's corner: `md` in the full view (`sm` on phones), `sm` in the side panel. */
export type GlowCardSize = (typeof GLOW_CARD_SIZES)[number];

export interface GlowCardProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> {
  size?: GlowCardSize;
  /** Placement only (margins, column breaks). */
  className?: string;
  /** What the card shows (its image, or its text): clipped to the card's corners. */
  children: ReactNode;
}
