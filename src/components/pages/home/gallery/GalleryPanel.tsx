"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import { useGalleryStore } from "#/stores/useGalleryStore";
import {
  PHOTO_LOCATIONS,
  type PhotoLocation,
} from "#/components/three.js/earth/data";
import { MediaTile } from "./GalleryMedia";

/**
 * The luxurious gallery side panel. Slides in from the right when a globe pin is
 * clicked, leaving the Earth visible + rotating beside it. Shows the place's
 * story and a masonry of its photos/videos; clicking a piece opens the lightbox.
 *
 * DOM overlay (crisp media, not WebGL). It keeps rendering the last place while
 * closing, so the slide-out animates gracefully.
 */
const GalleryPanel = () => {
  const openId = useGalleryStore((s) => s.openId);
  const close = useGalleryStore((s) => s.close);
  const openLightbox = useGalleryStore((s) => s.openLightbox);

  const loc = PHOTO_LOCATIONS.find((l) => l.id === openId) ?? null;
  const open = loc !== null;

  // Persist the last-shown place so the exit slide keeps its content.
  const [shown, setShown] = useState<PhotoLocation | null>(loc);
  useEffect(() => {
    if (loc) setShown(loc);
  }, [loc]);

  return (
    <aside
      aria-hidden={!open}
      className={clsx(
        "fixed right-0 top-0 z-50 flex h-[100dvh] w-full flex-col border-l border-white/10 bg-rich-black/80 shadow-[-30px_0_80px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-[transform,opacity] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] sm:w-[440px] lg:w-[540px]",
        open ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-full opacity-0"
      )}
    >
      {shown && (
        <>
          <header className="relative shrink-0 px-8 pt-12 lg:px-12">
            <button
              type="button"
              onClick={close}
              aria-label="Close gallery"
              className="absolute right-6 top-8 grid h-10 w-10 place-items-center rounded-full text-lg text-white/50 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-peach lg:right-10"
            >
              ✕
            </button>

            <p className="text-[11px] uppercase tracking-[0.4em] text-peach/80">
              {shown.country}
            </p>
            <h2 className="mt-3 text-4xl font-light leading-[1.05] tracking-tight text-white lg:text-5xl">
              {shown.place}
            </h2>
            <span className="mt-5 block h-px w-16 bg-gradient-to-r from-peach to-transparent" />
            {shown.blurb && (
              <p className="mt-6 max-w-sm text-[15px] font-light italic leading-relaxed text-gray-slate/70">
                {shown.blurb}
              </p>
            )}
            <p className="mt-6 text-[10px] uppercase tracking-[0.35em] text-white/30">
              {shown.media.length} pieces
            </p>
          </header>

          <div className="mt-8 flex-1 overflow-y-auto px-8 pb-14 lg:px-12">
            <div className="columns-2 [column-gap:0.75rem]">
              {shown.media.map((m, i) => (
                <MediaTile
                  key={i}
                  item={m}
                  index={i}
                  onClick={() => openLightbox(i)}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default GalleryPanel;
