import clsx from "clsx";
import Icon from "#/components/UI/icons/Icon";
import { pointerLight } from "#/components/UI/glass/pointerLight";
import Tooltip from "#/components/UI/tooltip/Tooltip";
import type { IconButtonProps } from "#/components/UI/buttons/button.types";

/**
 * A round liquid-glass button with one icon (Storybook: UI/IconButton) — the panels'
 * controls and the photo viewer's arrows (P27-80). Named by `label`; an optional
 * `tooltip` (UI/Tooltip) shows under it on hover or keyboard focus. 40px, with a 44px tap
 * area on phones. `className` places it (it never restyles it).
 */
const IconButton = ({
  icon,
  label,
  tooltip,
  tooltipAlign = "end",
  className,
  type = "button",
  ...props
}: IconButtonProps) => (
  <button
    {...props}
    type={type}
    aria-label={label}
    onPointerMove={pointerLight}
    className={clsx(
      "glass liquid tap-target group/tip relative grid size-10 shrink-0 place-items-center rounded-full text-white/72 hover:text-peach focus-visible:text-peach",
      className,
    )}
  >
    <Icon icon={icon} size={17} />
    {tooltip && (
      <Tooltip side="below" align={tooltipAlign}>
        {tooltip}
      </Tooltip>
    )}
  </button>
);

export default IconButton;
