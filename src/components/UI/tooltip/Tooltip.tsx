import clsx from "clsx";
import type { TooltipAlign, TooltipProps, TooltipSide } from "#/components/UI/tooltip/tooltip.types";

type Axis = "x" | "y";

const AXIS: Record<TooltipSide, Axis> = { above: "y", below: "y", left: "x", right: "x" };

/** Its place next to its trigger: 6px off the side it opens on. */
const SIDE: Record<TooltipSide, string> = {
  above: "bottom-full mb-1.5",
  below: "top-full mt-1.5",
  left: "top-1/2 right-full mr-1.5 -translate-y-1/2",
  right: "top-1/2 left-full ml-1.5 -translate-y-1/2",
};

/** Above or below: along its trigger. */
const ALIGN: Record<TooltipAlign, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

/** Hidden, it waits 4px back toward its trigger… */
const HIDDEN: Record<TooltipSide, string> = {
  above: "translate-y-1 opacity-0",
  below: "-translate-y-1 opacity-0",
  left: "translate-x-1 opacity-0",
  right: "-translate-x-1 opacity-0",
};

/** …and slides out to its place as it shows: while its trigger is hovered or focused… */
const ON_TRIGGER: Record<Axis, string> = {
  x: "group-hover/tip:visible group-hover/tip:translate-x-0 group-hover/tip:opacity-100 group-focus-visible/tip:visible group-focus-visible/tip:translate-x-0 group-focus-visible/tip:opacity-100",
  y: "group-hover/tip:visible group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-focus-visible/tip:visible group-focus-visible/tip:translate-y-0 group-focus-visible/tip:opacity-100",
};

/** …or while it's `open`. */
const SHOWN: Record<Axis, string> = {
  x: "visible translate-x-0 opacity-100",
  y: "visible translate-y-0 opacity-100",
};

/**
 * The site's tooltip (Storybook: UI/Tooltip, P27-82): a small dark pill of light text that
 * slides out of its trigger — a timeline star's chapter, the orb's "Next chapter", a panel
 * button's hint. It shows while its trigger (marked `group/tip`) is hovered or keyboard-focused
 * (only on screens that can hover), or while `open` (the timeline's name pill).
 *
 * Its text is light peach; a part of the page can tune it with `--color-tooltip` (the
 * timeline's dev panel does). Not interactive.
 *
 * Once faded out it's `invisible` too (P27-86): its blur was still drawn at opacity 0, every
 * frame. Not a `live` one: it stays in the page, so screen readers hear what it says.
 */
const Tooltip = ({ children, side = "below", align = "center", open, delayed = false, live = false }: TooltipProps) => (
  <span
    aria-hidden={live ? undefined : true}
    aria-live={live ? "polite" : undefined}
    className={clsx(
      "pointer-events-none absolute rounded-full bg-rich-black/85 px-3 py-1.5 font-sans text-2xs leading-none font-light tracking-wide whitespace-nowrap text-tooltip ring-1 ring-white/10 backdrop-blur-md transition-[opacity,translate,visibility] duration-200",
      SIDE[side],
      AXIS[side] === "y" && ALIGN[align],
      open ? SHOWN[AXIS[side]] : [HIDDEN[side], !live && "invisible"],
      open === undefined && ON_TRIGGER[AXIS[side]],
      open === undefined && delayed && "group-hover/tip:delay-800 group-focus-visible/tip:delay-800",
    )}
  >
    {children}
  </span>
);

export default Tooltip;
