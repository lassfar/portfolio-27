import clsx from "clsx";
import { ButtonProps } from "#/components/UI/buttons/button.types";

/**
 * The site's button (Storybook: UI/Button): a soft-glass pill, a thin peach ring and
 * light-peach text, glowing softly on hover, like the scene's labels and tooltips.
 * `variant` sets its tone and `size` its padding; the styles are the `.ui-button` block
 * in globals.css (design tokens only). The label sits in `.ui-button__label` so it can
 * be animated (e.g. written in with SplitText).
 */
const Button = ({
  label = "Button",
  size = "medium",
  state = "default", // not yet implemented (P27-34)
  variant = "primary",
  type = "button",
  icon,
  onClick = () => {},
  className,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    type={type}
    onClick={onClick}
    className={clsx(
      "ui-button",
      `ui-button--${variant}`,
      `ui-button--${size}`,
      className,
    )}
  >
    <span className="ui-button__label">{label}</span>
    {icon && (
      <span className="ui-button__icon" aria-hidden="true">
        {icon}
      </span>
    )}
  </button>
);

export default Button;
