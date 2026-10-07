import type { ButtonHTMLAttributes, Ref } from "react";
import type { LucideIcon } from "lucide-react";
import type { TooltipAlign } from "#/components/UI/tooltip/tooltip.types";

export const BUTTON_VARIANTS = ["primary", "secondary", "light", "outline", "text"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

export const BUTTON_SIZES = ["small", "medium", "large"] as const;
export type ButtonSize = (typeof BUTTON_SIZES)[number];

export const BUTTON_ICON_SLIDES = ["right", "down"] as const;
/** Which way its icon slides on hover: along the label, or down (an arrow down). */
export type ButtonIconSlide = (typeof BUTTON_ICON_SLIDES)[number];

/** What every button takes (P27-33): a native button's props and its ref; `className` places it. */
export interface ButtonBaseProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  ref?: Ref<HTMLButtonElement>;
}

export interface ButtonProps extends ButtonBaseProps {
  label: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** A trailing Lucide icon, sized to the button; it slides a little on hover (`iconSlide`). */
  icon?: LucideIcon;
  iconSlide?: ButtonIconSlide;
}

export interface IconButtonProps extends ButtonBaseProps {
  /** The Lucide glyph, imported from `lucide-react`. */
  icon: LucideIcon;
  /** Its accessible name (the button shows only the icon). */
  label: string;
  /** A short hint shown under it on hover / keyboard focus (e.g. "Close · Esc"). */
  tooltip?: string;
  /** Where its tooltip sits under it: flush with its right edge (the default), centred… */
  tooltipAlign?: TooltipAlign;
  /** A toggle's state (the motion switch): `aria-pressed`, and peach while pressed. */
  pressed?: boolean;
}
