"use client";

import { useCallback, useEffect } from "react";
import clsx from "clsx";
import { useGalleryStore } from "#/stores/useGalleryStore";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import { MediaFull } from "./GalleryMedia";

/**
 * Fullscreen lightbox for a single piece of media, opened from the gallery panel.
 * Photos fill the frame; videos play with sound + controls. Browse with the
 * on-screen chevrons or the ← / → keys; Esc closes.
 */
const Lightbox = () => {
  const openId = useGalleryStore((s) => s.openId);
  const index = useGalleryStore((s) => s.lightboxIndex);
  const setIndex = useGalleryStore((s) => s.setLightboxIndex);
  const closeLightbox = useGalleryStore((s) => s.closeLightbox);

  const loc = PHOTO_LOCATIONS.find((l) => l.id === openId) ?? null;
  const media = loc?.media ?? [];
  const count = media.length;
  const open = index !== null && index >= 0 && index < count;

  const step = useCallback(
    (dir: number) => {
      if (index === null || count === 0) return;
      setIndex((index + dir + count) % count);
    },
    [index, count, setIndex]
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step, closeLightbox]);

  const item = open ? media[index] : null;

  return (
    <div
      aria-hidden={!open}
      className={clsx(
        "fixed inset-0 z-[60] flex flex-col items-center justify-center bg-rich-black/95 backdrop-blur-xl transition-opacity duration-300",
        open ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      {item && (
        <>
          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Close"
            className="absolute right-6 top-6 z-10 grid h-11 w-11 place-items-center rounded-full text-xl text-white/60 ring-1 ring-white/10 transition hover:bg-white/5 hover:text-peach"
          >
            ✕
          </button>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous"
                className="absolute left-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-3xl text-white/50 transition hover:bg-white/5 hover:text-peach lg:left-8"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next"
                className="absolute right-4 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full text-3xl text-white/50 transition hover:bg-white/5 hover:text-peach lg:right-8"
              >
                ›
              </button>
            </>
          )}

          <MediaFull item={item} />

          <div className="mt-6 flex flex-col items-center gap-2 px-8 text-center">
            {item.caption && (
              <p className="max-w-xl text-sm font-light italic text-gray-slate/80">
                {item.caption}
              </p>
            )}
            <p className="text-[10px] uppercase tracking-[0.35em] text-white/35">
              {(index ?? 0) + 1} / {count}
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default Lightbox;
