import { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import type { LucideIcon } from "lucide-react";
import type { TooltipAlign } from "#/components/UI/tooltip/tooltip.types";

export const BUTTON_VARIANTS = ["primary", "secondary", "light", "outline", "text"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BUTTON_SIZES = ["small", "medium", "large"] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: ButtonSize;
  state?: "default" | "text" | "filled";
  variant?: ButtonVariant;
  /** A small trailing icon (e.g. "→"); it slides a little on hover. */
  icon?: ReactNode;
  onClick?: () => void;
}

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  ref?: Ref<HTMLButtonElement>;
  /** The Lucide glyph, imported from `lucide-react`. */
  icon: LucideIcon;
  /** Its accessible name (the button shows only the icon). */
  label: string;
  /** A short hint shown under it on hover / keyboard focus (e.g. "Close · Esc"). */
  tooltip?: string;
  /** Where its tooltip sits under it: flush with its right edge (the default), centred… */
  tooltipAlign?: TooltipAlign;
}
