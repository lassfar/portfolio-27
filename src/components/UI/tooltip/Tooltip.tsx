import clsx from "clsx";
import type { MouseEvent } from "react";
import type {
  TooltipAlign,
  TooltipProps,
  TooltipSide,
} from "#/components/UI/tooltip/tooltip.types";
import "#/components/UI/tooltip/dismiss";

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

/** Hidden, it waits 4px back toward its trigger (in calm motion it only fades: P27-92)… */
const HIDDEN: Record<TooltipSide, string> = {
  above: "opacity-0 moving:translate-y-1",
  below: "opacity-0 moving:-translate-y-1",
  left: "opacity-0 moving:translate-x-1",
  right: "opacity-0 moving:-translate-x-1",
};

/** …and slides out to its place as it shows: while its trigger is hovered or focused… */
const ON_TRIGGER: Record<Axis, string> = {
  x: "group-hover/tip:visible group-hover/tip:translate-x-0 group-hover/tip:opacity-100 group-focus-visible/tip:visible group-focus-visible/tip:translate-x-0 group-focus-visible/tip:opacity-100",
  y: "group-hover/tip:visible group-hover/tip:translate-y-0 group-hover/tip:opacity-100 group-focus-visible/tip:visible group-focus-visible/tip:translate-y-0 group-focus-visible/tip:opacity-100",
};

/**
 * Shown by its trigger's hover, it takes the pointer too, over a see-through bridge across the
 * 6px gap, so the pointer can move onto it without it closing: it's part of the trigger, whose
 * hover holds (WCAG 1.4.13, P27-101). Not the `open` ones: they aren't shown by a hover.
 */
const HOVERABLE: Record<TooltipSide, string> = {
  above: "before:absolute before:inset-x-0 before:top-full before:h-1.5",
  below: "before:absolute before:inset-x-0 before:bottom-full before:h-1.5",
  left: "before:absolute before:inset-y-0 before:left-full before:w-1.5",
  right: "before:absolute before:inset-y-0 before:right-full before:w-1.5",
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
 * timeline's dev panel does). Shown by a hover, it takes the pointer (it stays as the pointer
 * moves onto it), but a click on it does nothing: it sits inside its trigger, and isn't it.
 *
 * Once faded out it's `invisible` too (P27-86): its blur was still drawn at opacity 0, every
 * frame. Not a `live` one: it stays in the page, so screen readers hear what it says.
 *
 * Escape closes it, without moving the pointer or the focus (WCAG 1.4.13, ./dismiss). In calm
 * motion it only fades in, with no slide (P27-92).
 */
/** A click on a tooltip doesn't reach its trigger (P27-101): it isn't the button it's in. */
const ignoreClick = (event: MouseEvent) => {
  event.stopPropagation();
  event.preventDefault();
};

const Tooltip = ({
  children,
  side = "below",
  align = "center",
  open,
  delayed = false,
  live = false,
}: TooltipProps) => (
  <span
    onClick={ignoreClick}
    aria-hidden={live ? undefined : true}
    aria-live={live ? "polite" : undefined}
    className={clsx(
      "pointer-events-none absolute rounded-full bg-rich-black/85 px-3 py-1.5 font-sans text-2xs leading-none font-light tracking-wide whitespace-nowrap text-tooltip ring-1 ring-white/10 backdrop-blur-md transition-[opacity,translate,visibility] duration-200",
      SIDE[side],
      AXIS[side] === "y" && ALIGN[align],
      open ? SHOWN[AXIS[side]] : [HIDDEN[side], !live && "invisible"],
      open === undefined && [
        ON_TRIGGER[AXIS[side]],
        HOVERABLE[side],
        "group-hover/tip:pointer-events-auto",
      ],
      open === undefined &&
        delayed &&
        "group-hover/tip:delay-800 group-focus-visible/tip:delay-800",
      // Escape: hidden whatever else shows it (`!`: the trigger's hover outranks a plain variant).
      "tooltips-off:invisible! tooltips-off:opacity-0!",
    )}
  >
    {children}
  </span>
);

export default Tooltip;
