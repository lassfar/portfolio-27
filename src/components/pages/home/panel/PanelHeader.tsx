import clsx from "clsx";
import type { ReactNode } from "react";
import type { PanelView } from "#/stores/usePanelStore";
import AccentText from "#/components/UI/text/AccentText";
import Tag from "#/components/UI/tags/Tag";
import Swash from "#/components/UI/swash/Swash";
import { TITLE_SWASH } from "#/components/pages/home/swashes";
import { isLongQuote } from "./content";
import { RISE } from "./layout";
import type { PanelHeaderModel } from "./panel.types";

type HeaderSlots = {
  root: string;
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
    title: "mt-3.5 max-w-[13ch] text-balance text-display-sm sm:mt-5 sm:text-display",
    swash: "mt-0.5 w-45 sm:w-75",
    quote: "mt-4.5 max-w-[34ch] text-balance text-lg sm:mt-6 sm:text-quote",
    longQuote: "mt-4.5 max-w-[46ch] text-balance text-base leading-relaxed sm:mt-6 sm:text-quote-long",
    tags: "mt-5 justify-center gap-2 sm:mt-7 sm:gap-2.5",
  },
  side: {
    root: "flex w-full flex-col items-start text-left",
    title: "mt-3.5 text-pretty text-4xl leading-display sm:text-5xl",
    swash: "mt-0.5 w-45 sm:w-50",
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
 * A panel's header (P27-80), the same for a place and the Lab: the title in Great Vibes
 * with its key word in peach, a swash drawing itself in, the story as a short quote, and
 * glass tags. Its parts (`RISE`) rise in, and its swash draws, in the panel's entrance
 * timeline (ScenePanel).
 */
const PanelHeader = ({ view, model, titleId, children }: PanelHeaderProps) => {
  const slots = HEADER[view];
  return (
    <header className={slots.root}>
      <h2
        {...RISE}
        id={titleId}
        tabIndex={-1} // focus lands here when the place it was in is swapped (usePanelFrame)
        data-focus-key="title"
        className={clsx("pb-[0.06em] font-great-vibes font-normal text-white outline-hidden", slots.title)}
      >
        <AccentText text={model.title} />
      </h2>
      {/* It rises and draws in the panel's entrance timeline (ScenePanel). */}
      <Swash {...TITLE_SWASH.panel} draw="cue" className={slots.swash} />
      {model.blurb && (
        <p
          {...RISE}
          className={clsx("font-light text-white/84", isLongQuote(model.blurb) ? slots.longQuote : slots.quote)}
        >
          {/* The opening mark hangs a little low, like a printed quote (its own size: hence em). */}
          <span aria-hidden="true" className="mr-1.5 align-[-0.38em] font-quote text-[2em] leading-0 text-peach">
            “
          </span>
          {model.blurb}
        </p>
      )}
      <div {...RISE} className={clsx("flex flex-wrap", slots.tags)}>
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
