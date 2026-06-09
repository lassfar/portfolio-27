import clsx from "clsx";
import React from "react";
import { ButtonProps } from "#/components/UI/buttons/button.types";

const Button = ({
  label = "Button",
  size = "medium",
  state = "default",
  variant = "primary",
  onClick = () => {},
  ...props
}: ButtonProps) => {
  const getVariant = () => {
    switch (variant) {
      case "primary":
        return "bg-peach text-white border-none";
      case "secondary":
        return "bg-white text-peach";
      case "light":
        return "bg-light-peach text-dark-peach";
      case "outline":
        return "border-peach bg-transparent text-peach";
      default:
        return "bg-peach text-white";
    }
  };

  const getSize = () => {
    switch (size) {
      case "medium":
        return `px-4 py-1 text-normal ${
          variant === "outline" ? "border border-solid border-1" : ""
        }`;
      case "small":
        return `px-2 py-1 bg-peach text-sm ${
          variant === "outline" ? "border border-solid border-0.5" : ""
        }`;
      case "large":
        return `px-10 py-3 text-xl font-bold tracking-tighter ${
          variant === "outline" ? "border border-solid border-2" : ""
        }`;
      default:
        return "px-4 py-2 text-normal";
    }
  };

  return (
    <button
      {...props}
      onClick={onClick}
      className={clsx(
        "flex items-center gap-1 w-fit rounded-md cursor-pointer",
        getVariant(),
        getSize(),
        props.className ? props.className : ""
      )}
      type="button"
    >
      {label}
    </button>
  );
};

export default Button;
