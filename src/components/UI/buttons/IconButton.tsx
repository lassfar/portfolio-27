import clsx from "clsx";
import Icon from "#/components/UI/icons/Icon";
import { pointerLight } from "#/components/UI/glass/pointerLight";
import type { IconButtonProps, TooltipAlign } from "#/components/UI/buttons/button.types";

const TOOLTIP_ALIGN: Record<TooltipAlign, string> = {
  end: "right-0",
  center: "left-1/2 -translate-x-1/2",
};

/**
 * A round liquid-glass button with one icon (Storybook: UI/IconButton) — the panels'
 * controls and the photo viewer's arrows (P27-80). Named by `label`; an optional
 * `tooltip` shows under it on hover or keyboard focus. 40px, with a 44px tap area on phones.
 * `className` places it (it never restyles it).
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
      "glass liquid tap-target group/icon-button relative grid size-10 shrink-0 place-items-center rounded-full text-white/72 hover:text-peach focus-visible:text-peach",
      className,
    )}
  >
    <Icon icon={icon} size={17} />
    {tooltip && (
      <span
        aria-hidden="true"
        className={clsx(
          "pointer-events-none absolute top-full mt-2 -translate-y-0.75 whitespace-nowrap rounded-full bg-rich-black/88 px-2.5 py-1.25 text-2xs leading-none text-light-peach opacity-0 inset-ring inset-ring-white/10 transition duration-200",
          "group-hover/icon-button:translate-y-0 group-hover/icon-button:opacity-100 group-focus-visible/icon-button:translate-y-0 group-focus-visible/icon-button:opacity-100",
          TOOLTIP_ALIGN[tooltipAlign],
        )}
      >
        {tooltip}
      </span>
    )}
  </button>
);

export default IconButton;
