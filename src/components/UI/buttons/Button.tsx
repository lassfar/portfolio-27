import clsx from "clsx";
import Icon from "#/components/UI/icons/Icon";
import type { ButtonProps, ButtonSize } from "#/components/UI/buttons/button.types";

/** Its icon, a little taller than its label's capitals. */
const ICON_SIZE: Record<ButtonSize, number> = { small: 13, medium: 15, large: 17 };

/**
 * The site's button (Storybook: UI/Button): a soft-glass pill, a thin peach ring and
 * light-peach text, glowing softly on hover, like the scene's labels and tooltips.
 * `variant` sets its tone and `size` its padding; the styles are the `.ui-button` block
 * in globals.css (design tokens only). The label sits in `.ui-button__label` so it can
 * be animated (e.g. written in with SplitText); an `icon` follows it (`.ui-button__icon`).
 */
const Button = ({
  label = "Button",
  size = "medium",
  state, // not yet implemented (P27-34): kept out of the button's attributes
  variant = "primary",
  type = "button",
  icon,
  iconSlide = "right",
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
      <span className={clsx("ui-button__icon", `ui-button__icon--${iconSlide}`)} aria-hidden="true">
        <Icon icon={icon} size={ICON_SIZE[size]} />
      </span>
    )}
  </button>
);

export default Button;
