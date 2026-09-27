import { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "small" | "medium" | "large";
  state?: "default" | "text" | "filled";
  variant?: "primary" | "secondary" | "light" | "outline" | "text";
  /** A small trailing icon (e.g. "→"); it slides a little on hover. */
  icon?: ReactNode;
  onClick?: () => void;
}
