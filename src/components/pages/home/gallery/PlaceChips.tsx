import clsx from "clsx";
import type { CSSProperties } from "react";
import Chip from "#/components/UI/tags/Chip";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import type { PanelView } from "#/stores/usePanelStore";
import { shortName } from "#/components/pages/home/panel/content";
import { RISE } from "#/components/pages/home/panel/layout";

const ROW: Record<PanelView, string> = {
  full: "mt-6 justify-center sm:mt-8",
  side: "mt-5 justify-start",
};

/** "Places" sits before the pills in the full view (above them on a phone), above them at the side. */
const LABEL: Record<PanelView, string> = {
  full: "max-sm:mb-1 max-sm:w-full sm:mr-1.5",
  side: "mb-1 w-full",
};

export interface PlaceChipsProps {
  view: PanelView;
  currentId: string;
  onPick: (id: string) => void;
  className?: string;
  style?: CSSProperties;
}

/** A panel's places as pills (P27-80): the one showing is filled peach; another opens there. A part of the panel's entrance (`RISE`). */
const PlaceChips = ({ view, currentId, onPick, className, style }: PlaceChipsProps) => (
  <nav {...RISE} aria-label="Places" className={clsx("flex flex-wrap items-center gap-2", ROW[view], className)} style={style}>
    <p className={clsx("text-3xs uppercase tracking-eyebrow text-white/50", LABEL[view])}>Places</p>
    {PHOTO_LOCATIONS.map((loc) => (
      <Chip
        key={loc.id}
        current={loc.id === currentId}
        data-focus-key={`chip:${loc.id}`}
        onClick={() => onPick(loc.id)}
      >
        {shortName(loc)}
      </Chip>
    ))}
  </nav>
);

export default PlaceChips;
