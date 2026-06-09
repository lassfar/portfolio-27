import { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: "small" | "medium" | "large";
  state?: "default" | "text" | "filled";
  variant?: "primary" | "secondary" | "light" | "outline";
  onClick?: () => void;
}
