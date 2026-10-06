import clsx from "clsx";
import { usePanelStore, type PanelView } from "#/stores/usePanelStore";
import PanelHeader from "#/components/pages/home/panel/PanelHeader";
import { findPlace, placeHeader } from "#/components/pages/home/panel/content";
import { MEDIA, RISE, RISE_AFTER_HEADER, riseAt } from "#/components/pages/home/panel/layout";
import MediaCard from "./MediaCard";
import PlaceChips from "./PlaceChips";
import PlaceStepper from "./PlaceStepper";

/** Three columns in the full view (two on a phone), two at the side. */
const GRID: Record<PanelView, string> = {
  full: "columns-2 gap-x-3 sm:columns-3 sm:gap-x-5",
  side: "columns-2 gap-x-3",
};

const CARD: Record<PanelView, string> = {
  full: "mb-3 break-inside-avoid sm:mb-5",
  side: "mb-3 break-inside-avoid",
};

const openPlace = (id: string) => usePanelStore.getState().open({ kind: "place", id });

/**
 * A place in the panel (P27-80): its header with the other places as pills, its photos
 * and clips as glow cards (a masonry; one opens the photo viewer), then on to the
 * previous or next place.
 */
const PlaceContent = ({ id, view, titleId }: { id: string; view: PanelView; titleId: string }) => {
  const openPhoto = usePanelStore((s) => s.openPhoto);
  const loc = findPlace(id);
  if (!loc) return null;
  return (
    <>
      <PanelHeader view={view} model={placeHeader(loc)} titleId={titleId}>
        <PlaceChips view={view} currentId={id} onPick={openPlace} className={RISE} style={riseAt(5)} />
      </PanelHeader>
      <div className={MEDIA[view]}>
        <div className={GRID[view]}>
          {loc.media.map((item, i) => (
            <MediaCard
              key={item.src}
              item={item}
              index={i}
              name={`${loc.place} ${String(i + 1).padStart(2, "0")}`}
              size={view === "full" ? "md" : "sm"}
              className={clsx(RISE, CARD[view])}
              style={riseAt(RISE_AFTER_HEADER + i)}
              onOpen={() => openPhoto(i)}
            />
          ))}
        </div>
      </div>
      <PlaceStepper view={view} currentId={id} onPick={openPlace} />
    </>
  );
};

export default PlaceContent;
