"use client";

import { useCallback, useEffect } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import IconButton from "#/components/UI/buttons/IconButton";
import { useLingering } from "#/components/hooks/useLingering";
import { usePanelStore } from "#/stores/usePanelStore";
import { findPlace, wrapIndex } from "#/components/pages/home/panel/content";
import { MediaFull } from "./GalleryMedia";

/** Where the arrows sit: at the sides, centred — at the bottom corners on a phone. */
const ARROW = {
  prev: "bottom-6 left-5 sm:top-1/2 sm:bottom-auto sm:left-10 sm:-translate-y-1/2",
  next: "right-5 bottom-6 sm:top-1/2 sm:right-10 sm:bottom-auto sm:-translate-y-1/2",
} as const;

/**
 * The photo viewer (P27-80): one of a place's photos or clips over everything, the
 * scene and the panel dimmed behind it — "2 / 5" and its caption under it, liquid-glass
 * arrows and close. ← → step through them; Esc (or close) goes back to the panel. It
 * keeps its photo while it fades out. A video plays here, with sound and controls.
 */
const Lightbox = () => {
  const placeId = usePanelStore((s) => (s.content?.kind === "place" ? s.content.id : null));
  const photo = usePanelStore((s) => s.photo);
  const media = findPlace(placeId)?.media ?? [];
  const open = photo !== null && photo < media.length;
  const shownPlace = findPlace(useLingering(open ? placeId : null));
  const index = useLingering(open ? photo : null);
  const items = shownPlace?.media ?? [];
  const item = index !== null ? items[index] : undefined;
  const count = items.length;

  const step = useCallback(
    (dir: number) => {
      const { photo: now, openPhoto } = usePanelStore.getState();
      if (now !== null && count > 0) openPhoto(wrapIndex(now + dir, count));
    },
    [count],
  );
  const back = () => usePanelStore.getState().back();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") usePanelStore.getState().back();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      inert={!open}
      className={clsx(
        "fixed inset-0 z-60 flex flex-col items-center gap-6 bg-black/80 px-4 pt-20 pb-24 backdrop-blur-lg transition-[opacity,visibility] duration-350 ease-out motion-reduce:transition-none sm:px-30 sm:pt-22 sm:pb-10",
        open ? "visible opacity-100" : "invisible opacity-0",
      )}
    >
      {item && index !== null && (
        <>
          <div className="absolute top-4.5 right-4.5 z-1 sm:top-8 sm:right-10">
            <IconButton icon={X} label="Close the photo" onClick={back} />
          </div>
          {count > 1 && (
            <>
              <div className={clsx("absolute z-1", ARROW.prev)}>
                <IconButton icon={ChevronLeft} label="Previous photo" onClick={() => step(-1)} />
              </div>
              <div className={clsx("absolute z-1", ARROW.next)}>
                <IconButton icon={ChevronRight} label="Next photo" onClick={() => step(1)} />
              </div>
            </>
          )}
          <div className="grid min-h-0 w-full flex-1 place-items-center">
            <MediaFull key={`${shownPlace?.id}-${index}`} item={item} index={index} />
          </div>
          <p className="flex max-w-full items-center gap-4 text-xs text-gray-slate/60 tabular-nums">
            <span className="shrink-0 tracking-eyebrow-sm text-peach">
              {index + 1} / {count}
            </span>
            {item.caption && <span className="truncate">{item.caption}</span>}
          </p>
        </>
      )}
    </div>
  );
};

export default Lightbox;
