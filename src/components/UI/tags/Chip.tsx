import clsx from "clsx";
import { pointerLight } from "#/components/UI/glass/pointerLight";
import type { ChipProps } from "#/components/UI/tags/tag.types";

/**
 * A liquid-glass pill button for picking one of a few (Storybook: UI/Chip) — e.g. a
 * panel's places (P27-80). The `current` one is filled peach and marked `aria-current`.
 */
const Chip = ({ current = false, className, type = "button", ...props }: ChipProps) => (
  <button
    {...props}
    type={type}
    aria-current={current || undefined}
    onPointerMove={pointerLight}
    className={clsx(
      "liquid tap-target relative inline-flex items-center gap-1.5 rounded-full glass px-3.5 py-2 text-xs font-light text-light-peach",
      "aria-[current=true]:bg-peach aria-[current=true]:bg-none aria-[current=true]:text-rich-black aria-[current=true]:shadow-chip",
      className,
    )}
  />
);

export default Chip;
