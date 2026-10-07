import clsx from "clsx";
import type { PanelView } from "#/stores/usePanelStore";
import { RISE } from "./layout";
import type { PanelHeaderModel } from "./panel.types";

type EyebrowSlots = { root: string; lead: string; trail: string };

/**
 * A row as tall as the panel's buttons (it starts on their line), clear of them: centred
 * in the full view, at the start at the side and on a phone (a centred line would run
 * into them there). Then the space down to the title.
 */
const EYEBROW: Record<PanelView, EyebrowSlots> = {
  full: {
    root: "mb-10 justify-start gap-2 pr-26 text-3xs tracking-eyebrow-sm sm:mb-12 sm:justify-center sm:gap-3.5 sm:px-18 sm:text-center sm:text-2xs sm:tracking-eyebrow",
    lead: "hidden sm:block sm:w-12",
    trail: "w-4 sm:w-12",
  },
  side: {
    root: "justify-start gap-2 pr-26 text-3xs tracking-eyebrow-sm sm:mb-4 sm:gap-2.5 sm:pr-24",
    lead: "hidden",
    trail: "w-4 sm:w-6",
  },
};

export interface PanelEyebrowProps {
  view: PanelView;
  eyebrow: PanelHeaderModel["eyebrow"];
}

/**
 * The panel's top line (P27-80): a place in peach and a detail ("United Kingdom ·
 * 51.51° N, 0.13° W"), between thin peach lines. At the top of the content, on the
 * panel's buttons' line; it scrolls away with the content (the buttons stay). A long
 * detail wraps.
 */
const PanelEyebrow = ({ view, eyebrow }: PanelEyebrowProps) => {
  const slots = EYEBROW[view];
  return (
    <p
      {...RISE}
      className={clsx(
        "flex min-h-10 w-full items-center text-light-peach/62 uppercase tabular-nums",
        slots.root,
      )}
    >
      <span
        aria-hidden="true"
        className={clsx("h-px shrink-0 bg-linear-to-r from-transparent to-peach/80", slots.lead)}
      />
      <span className="shrink-0 whitespace-nowrap text-peach">{eyebrow.place}</span>
      <span aria-hidden="true" className="text-peach/50">
        ·
      </span>
      <span>{eyebrow.detail}</span>
      <span
        aria-hidden="true"
        className={clsx("h-px shrink-0 bg-linear-to-l from-transparent to-peach/80", slots.trail)}
      />
    </p>
  );
};

export default PanelEyebrow;
