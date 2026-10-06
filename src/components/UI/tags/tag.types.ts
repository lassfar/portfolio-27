import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface TagProps {
  /** A leading Lucide glyph, in peach. */
  icon?: LucideIcon;
  children: ReactNode;
}

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** The chip of the thing showing now: filled peach (`aria-current`). */
  current?: boolean;
}
