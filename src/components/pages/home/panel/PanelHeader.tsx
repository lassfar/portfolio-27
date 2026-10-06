import clsx from "clsx";
import type { ReactNode } from "react";
import type { PanelView } from "#/stores/usePanelStore";
import AccentText from "#/components/UI/text/AccentText";
import Tag from "#/components/UI/tags/Tag";
import Swash from "./Swash";
import { isLongQuote } from "./content";
import { RISE, riseAt } from "./layout";
import type { PanelHeaderModel } from "./panel.types";

type HeaderSlots = {
  root: string;
  eyebrow: string;
  /** The hairline before the eyebrow (the full view has one each side). */
  lead: string;
  trail: string;
  title: string;
  swash: string;
  quote: string;
  longQuote: string;
  tags: string;
};

/** The full view centres the header like the Maker; the side panel is a left-aligned reading column. */
const HEADER: Record<PanelView, HeaderSlots> = {
  full: {
    root: "flex max-w-panel-head flex-col items-center text-center",
    eyebrow: "justify-center gap-2 text-3xs tracking-eyebrow-sm sm:gap-3.5 sm:text-2xs sm:tracking-eyebrow",
    lead: "w-4 sm:w-12",
    trail: "w-4 sm:w-12",
    title: "mt-3.5 max-w-[13ch] text-balance text-display-sm sm:mt-5 sm:text-display",
    swash: "h-5.5 w-45 sm:h-7.5 sm:w-75",
    quote: "mt-4.5 max-w-[34ch] text-balance text-lg sm:mt-6 sm:text-quote",
    longQuote: "mt-4.5 max-w-[46ch] text-balance text-base leading-relaxed sm:mt-6 sm:text-quote-long",
    tags: "mt-5 justify-center gap-2 sm:mt-7 sm:gap-2.5",
  },
  side: {
    root: "flex w-full flex-col items-start text-left",
    eyebrow: "justify-start gap-2 text-3xs tracking-eyebrow-sm sm:gap-2.5",
    lead: "hidden",
    trail: "w-4 sm:w-6",
    title: "mt-3.5 text-pretty text-4xl leading-display sm:text-5xl",
    swash: "h-5.5 w-45 sm:w-50",
    quote: "mt-4.5 text-pretty text-base leading-relaxed",
    longQuote: "mt-4.5 text-pretty text-sm leading-relaxed",
    tags: "mt-5 justify-start gap-2",
  },
};

export interface PanelHeaderProps {
  view: PanelView;
  model: PanelHeaderModel;
  /** The title's id: the panel is named by it. */
  titleId: string;
  /** Under the tags (a place's other places). */
  children?: ReactNode;
}

/**
 * A panel's header (P27-80), the same for a place and the Lab: the eyebrow (a place in
 * peach and a detail, between thin peach lines), the title in Great Vibes with its key
 * word in peach, a swash drawing itself in, the story as a short quote, and glass tags.
 * Its parts rise in one after another.
 */
const PanelHeader = ({ view, model, titleId, children }: PanelHeaderProps) => {
  const slots = HEADER[view];
  return (
    <header className={slots.root}>
      <p
        className={clsx(RISE, "flex items-center uppercase tabular-nums text-light-peach/62", slots.eyebrow)}
        style={riseAt(0)}
      >
        <span aria-hidden="true" className={clsx("h-px shrink-0 bg-linear-to-r from-transparent to-peach/80", slots.lead)} />
        <span className="text-peach">{model.eyebrow.place}</span>
        <span aria-hidden="true" className="text-peach/50">
          ·
        </span>
        <span>{model.eyebrow.detail}</span>
        <span aria-hidden="true" className={clsx("h-px shrink-0 bg-linear-to-l from-transparent to-peach/80", slots.trail)} />
      </p>
      <h2
        id={titleId}
        tabIndex={-1} // focus lands here when the place it was in is swapped (usePanelFrame)
        data-focus-key="title"
        className={clsx(RISE, "pb-[0.06em] font-great-vibes font-normal text-white outline-hidden", slots.title)}
        style={riseAt(1)}
      >
        <AccentText text={model.title} />
      </h2>
      <Swash className={clsx(RISE, slots.swash)} style={riseAt(2)} />
      {model.blurb && (
        <p
          className={clsx(
            RISE,
            "font-light text-white/84",
            isLongQuote(model.blurb) ? slots.longQuote : slots.quote,
          )}
          style={riseAt(3)}
        >
          {/* The opening mark hangs a little low, like a printed quote (its own size: hence em). */}
          <span aria-hidden="true" className="mr-1.5 align-[-0.38em] font-quote text-[2em] leading-0 text-peach">
            “
          </span>
          {model.blurb}
        </p>
      )}
      <div className={clsx(RISE, "flex flex-wrap", slots.tags)} style={riseAt(4)}>
        {model.tags.map((tag) => (
          <Tag key={tag.label} icon={tag.icon}>
            {tag.label}
          </Tag>
        ))}
      </div>
      {children}
    </header>
  );
};

export default PanelHeader;
