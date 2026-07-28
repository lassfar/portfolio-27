"use client";

import { useState } from "react";
import clsx from "clsx";
import type { MediaItem } from "#/components/three.js/earth/data";

/**
 * An elegant placeholder tile, shown until the real file exists at `item.src`.
 * Varied aspect ratios give the masonry an editorial rhythm even before photos
 * are added.
 */
function Placeholder({ item, index = 0 }: { item: MediaItem; index?: number }) {
  const aspect = ["aspect-[4/5]", "aspect-square", "aspect-[3/4]"][index % 3];
  return (
    <div
      className={clsx(
        "flex w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-white/[0.08] via-white/[0.02] to-white/[0.06]",
        aspect
      )}
    >
      <span className="text-[10px] uppercase tracking-[0.35em] text-peach/45">
        {item.type}
      </span>
      <span className="max-w-[80%] text-center text-[11px] leading-relaxed text-gray-slate/35">
        {item.caption ?? "coming soon"}
      </span>
    </div>
  );
}

/** A gallery thumbnail — image, or an autoplay muted-loop video clip. */
export function MediaTile({
  item,
  index,
  onClick,
}: {
  item: MediaItem;
  index: number;
  onClick: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const isVideo = item.type === "video";
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl ring-1 ring-white/10 transition duration-300 ease-out hover:-translate-y-0.5 hover:ring-peach/40 hover:shadow-[0_16px_50px_-16px_rgba(255,161,74,0.4)]"
    >
      {failed ? (
        <Placeholder item={item} index={index} />
      ) : isVideo ? (
        <video
          src={item.src}
          poster={item.poster}
          muted
          loop
          autoPlay
          playsInline
          onError={() => setFailed(true)}
          className="block w-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.src}
          alt={item.caption ?? ""}
          loading="lazy"
          onError={() => setFailed(true)}
          className="block w-full object-cover"
        />
      )}

      {isVideo && !failed && (
        <span className="pointer-events-none absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full bg-rich-black/55 text-[10px] text-white/90 backdrop-blur-sm">
          ▶
        </span>
      )}

      {item.caption && (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1.5 bg-gradient-to-t from-rich-black/90 via-rich-black/40 to-transparent px-3.5 pb-3 pt-8 text-left text-[11px] leading-snug text-light-peach opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          {item.caption}
        </span>
      )}
    </button>
  );
}

/** The fullscreen media in the lightbox — image, or video with sound + controls. */
export function MediaFull({ item }: { item: MediaItem }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="w-[70vw] max-w-3xl overflow-hidden rounded-lg ring-1 ring-white/10">
        <Placeholder item={item} />
      </div>
    );
  }
  return item.type === "video" ? (
    <video
      src={item.src}
      poster={item.poster}
      controls
      autoPlay
      loop
      playsInline
      onError={() => setFailed(true)}
      className="max-h-[82vh] max-w-[88vw] rounded-lg shadow-2xl"
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.src}
      alt={item.caption ?? ""}
      onError={() => setFailed(true)}
      className="max-h-[82vh] max-w-[88vw] rounded-lg object-contain shadow-2xl"
    />
  );
}
