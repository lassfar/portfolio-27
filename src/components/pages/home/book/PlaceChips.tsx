"use client";

import type { ReactNode } from "react";
import { ArrowUpRight, Camera, MemoryStick, type LucideIcon } from "lucide-react";
import Icon from "#/components/UI/icons/Icon";
import Chip from "#/components/UI/tags/Chip";
import { PANEL_ID } from "#/components/pages/home/panel/config";
import { BOOK } from "#/components/pages/home/story/copy";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import { panelKey, selectKey, usePanelStore, type PanelContent } from "#/stores/usePanelStore";

type OpenerProps = {
  content: PanelContent;
  icon: LucideIcon;
  name: string;
  /** A shorter name, shown on a phone (P27-95: "New Forest"); the full one is still read. */
  short?: string;
  meta: string;
};

/**
 * A chip that opens the panel (a place, the Lab): the book's way in, where the journey has
 * its scene labels. Marked as their label (`data-scene-label`), so the focus comes back to it
 * when the panel closes (usePanelModal).
 */
const Opener = ({ content, icon, name, short, meta }: OpenerProps) => {
  const key = panelKey(content);
  const open = usePanelStore(selectKey) === key;
  return (
    <Chip
      data-scene-label={key}
      aria-haspopup="dialog"
      aria-controls={PANEL_ID}
      aria-expanded={open}
      onClick={() => usePanelStore.getState().open(content)}
      className="gap-2"
    >
      <Icon icon={icon} size={15} className="text-peach" />
      {short ? (
        <>
          <span aria-hidden="true" className="sm:hidden">
            {short}
          </span>
          <span className="max-sm:sr-only">{name}</span>
        </>
      ) : (
        name
      )}
      <span className="text-light-peach/55">· {meta}</span>
      <Icon icon={ArrowUpRight} size={15} />
    </Chip>
  );
};

const Chips = ({ children }: { children: ReactNode }) => (
  <div className="mt-6 flex flex-wrap gap-2.5">{children}</div>
);

/** The Earth's places, each opening its photos (P27-93). */
export const PlaceChips = () => (
  <Chips>
    {PHOTO_LOCATIONS.map((place) => (
      <Opener
        key={place.id}
        content={{ kind: "place", id: place.id }}
        icon={Camera}
        name={place.place}
        short={place.short}
        meta={`${place.media.length} ${BOOK.shots}`}
      />
    ))}
  </Chips>
);

/** Parker's memory card, opening the Lab (P27-93). */
export const LabChip = () => (
  <Chips>
    <Opener
      content={{ kind: "lab" }}
      icon={MemoryStick}
      name={BOOK.lab.name}
      meta={BOOK.lab.meta}
    />
  </Chips>
);
