import { ButtonHTMLAttributes, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "small" | "medium" | "large";
  state?: "default" | "text" | "filled";
  variant?: "primary" | "secondary" | "light" | "outline" | "text";
  /** A small trailing icon (e.g. "→"); it slides a little on hover. */
  icon?: ReactNode;
  onClick?: () => void;
}

/** Where an IconButton's tooltip sits under it: flush with its right edge, or centred. */
export type TooltipAlign = "end" | "center";

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** The Lucide glyph, imported from `lucide-react`. */
  icon: LucideIcon;
  /** Its accessible name (the button shows only the icon). */
  label: string;
  /** A short hint shown under it on hover / keyboard focus (e.g. "Close · Esc"). */
  tooltip?: string;
  tooltipAlign?: TooltipAlign;
}
