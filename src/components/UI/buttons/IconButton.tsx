import clsx from "clsx";
import Icon from "#/components/UI/icons/Icon";
import { pointerLight } from "#/components/UI/glass/pointerLight";
import { BUTTON_BASE, BUTTON_ICON_SIZE } from "#/components/UI/buttons/base";
import Tooltip from "#/components/UI/tooltip/Tooltip";
import type { IconButtonProps } from "#/components/UI/buttons/button.types";

/**
 * A round liquid-glass button with one icon (Storybook: UI/IconButton) — the panels'
 * controls and the photo viewer's arrows (P27-80); Button's sibling, with the family's
 * shared behaviour (`BUTTON_BASE`, P27-33). Named by `label`; an optional
 * `tooltip` (UI/Tooltip) shows under it on hover or keyboard focus. 40px, with a 44px tap
 * area on phones. With `pressed`, a toggle (`aria-pressed`), peach while pressed (P27-92).
 * `className` places it (it never restyles it).
 */
const IconButton = ({
  icon,
  label,
  tooltip,
  tooltipAlign = "end",
  pressed,
  className,
  type = "button",
  ...props
}: IconButtonProps) => (
  <button
    {...props}
    type={type}
    aria-label={label}
    aria-pressed={pressed}
    onPointerMove={pointerLight}
    className={clsx(
      BUTTON_BASE,
      "group/tip liquid grid size-10 shrink-0 place-items-center rounded-full glass text-white/72 hover:text-peach focus-visible:text-peach aria-pressed:text-peach",
      className,
    )}
  >
    <Icon icon={icon} size={BUTTON_ICON_SIZE.large} />
    {tooltip && (
      <Tooltip side="below" align={tooltipAlign}>
        {tooltip}
      </Tooltip>
    )}
  </button>
);

export default IconButton;
