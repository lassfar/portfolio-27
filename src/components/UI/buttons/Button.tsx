import clsx from "clsx";
import Icon from "#/components/UI/icons/Icon";
import { BUTTON_BASE, BUTTON_ICON_SIZE } from "#/components/UI/buttons/base";
import type {
  ButtonIconSlide,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from "#/components/UI/buttons/button.types";

/** The frosted glass (all but `text`): it blurs what's behind it, a thin ring, a faint top highlight. */
const GLASS =
  "backdrop-blur-md backdrop-saturate-140 inset-ring inset-shadow-edge inset-shadow-gray-slate/22";

/** Each variant's tones: at rest, then hovered (the ring warms up, a soft glow appears) and focused. */
const VARIANT: Record<ButtonVariant, string> = {
  primary: clsx(
    GLASS,
    "bg-gray-slate/10 text-light-peach inset-ring-peach/55 focus-visible:inset-ring-peach",
    "enabled:hover:bg-gray-slate/16 enabled:hover:shadow-button-glow enabled:hover:shadow-peach/45 enabled:hover:inset-ring-peach",
  ),
  outline: clsx(
    GLASS,
    "bg-peach/6 text-peach inset-ring-peach/70 focus-visible:inset-ring-peach",
    "enabled:hover:bg-peach/12 enabled:hover:shadow-button-glow enabled:hover:shadow-peach/45 enabled:hover:inset-ring-peach",
  ),
  secondary: clsx(
    GLASS,
    "bg-gray-slate/10 text-gray-slate inset-ring-gray-slate/30 focus-visible:inset-ring-gray-slate/70",
    "enabled:hover:bg-gray-slate/16 enabled:hover:shadow-button-glow enabled:hover:shadow-gray-slate/22 enabled:hover:inset-ring-gray-slate/70",
  ),
  light: clsx(
    GLASS,
    "bg-light-peach/16 text-light-peach inset-ring-light-peach/40 focus-visible:inset-ring-light-peach",
    "enabled:hover:bg-light-peach/24 enabled:hover:shadow-button-glow enabled:hover:shadow-light-peach/35 enabled:hover:inset-ring-light-peach",
  ),
  text: "bg-transparent text-peach enabled:hover:text-light-peach",
};

/**
 * Each size's text and height. In `em`, so its padding and gap scale with its text; the
 * letter spacing tightens as the text grows (small text needs a little air, large none).
 */
const SIZE: Record<ButtonSize, string> = {
  small: "py-[0.5em] text-xs tracking-[0.02em]",
  medium: "py-[0.7em] text-sm tracking-[0.01em]",
  large: "py-[0.85em] text-base tracking-normal",
};

/** Its sides: a pill's, or just a little air for `text`. */
const PADDING_X: Record<ButtonSize, string> = {
  small: "px-[1em]",
  medium: "px-[1.4em]",
  large: "px-[1.9em]",
};

/**
 * Its icon slides a little on hover, the way it points. On `translate`, not `transform`:
 * the navigation assistant writes the icon in with GSAP, which owns its transform.
 */
const SLIDE: Record<ButtonIconSlide, string> = {
  right: "moving:group-enabled/button:group-hover/button:translate-x-0.75",
  down: "moving:group-enabled/button:group-hover/button:translate-y-0.5",
};

/**
 * The site's button (Storybook: UI/Button): a soft frosted-glass pill, a thin ring and
 * light-peach text, glowing softly on hover (P27-75); built on Tailwind utilities with the
 * family's shared behaviour (`BUTTON_BASE`, P27-33). `variant` sets its tone and `size`
 * its text. Its label (`data-button-label`) and icon (`data-button-icon`) can be animated
 * (the navigation assistant writes them in). `className` places it.
 */
const Button = ({
  label,
  variant = "primary",
  size = "medium",
  icon,
  iconSlide = "right",
  type = "button",
  className,
  ...props
}: ButtonProps) => (
  <button
    {...props}
    type={type}
    className={clsx(
      BUTTON_BASE,
      "group/button inline-flex w-fit items-center justify-center gap-[0.55em] rounded-full border-0 font-sans leading-none font-medium whitespace-nowrap",
      "transition-[color,background-color,box-shadow,scale] duration-[300ms,300ms,400ms,300ms] ease-[ease] moving:enabled:active:scale-98",
      "disabled:inset-shadow-none",
      VARIANT[variant],
      SIZE[size],
      variant === "text" ? "px-[0.3em]" : PADDING_X[size],
      className,
    )}
  >
    <span data-button-label="">{label}</span>
    {icon && (
      <span
        data-button-icon=""
        aria-hidden="true"
        className={clsx(
          "inline-flex transition-[translate] duration-300 ease-[ease]",
          SLIDE[iconSlide],
        )}
      >
        <Icon icon={icon} size={BUTTON_ICON_SIZE[size]} />
      </span>
    )}
  </button>
);

export default Button;
