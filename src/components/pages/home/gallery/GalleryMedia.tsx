"use client";

import { useState } from "react";
import clsx from "clsx";
import type { MediaItem } from "#/components/three.js/earth/data";

/** Where each placeholder's soft light sits (varied, so a grid of them has some rhythm). */
const PLACEHOLDER_LIGHT = [
  "bg-radial-[70%_55%_at_30%_25%] from-light-peach/16",
  "bg-radial-[70%_55%_at_70%_40%] from-peach/14",
  "bg-radial-[70%_55%_at_45%_75%] from-light-baby-blue/12",
] as const;

/** The placeholders' shapes in a grid (a real photo has its own, or its `aspect`). */
export const PLACEHOLDER_RATIO = ["aspect-4/5", "aspect-square", "aspect-3/4", "aspect-4/3", "aspect-5/6"] as const;

/**
 * A photo's stand-in until its file exists (the gallery's media are placeholders for now):
 * a soft light on the dark, with film grain. Fills its box.
 */
export const MediaPlaceholder = ({ index = 0 }: { index?: number }) => (
  <span
    className={clsx(
      "absolute inset-0 bg-dark to-transparent to-70%",
      PLACEHOLDER_LIGHT[index % PLACEHOLDER_LIGHT.length],
    )}
  >
    <span className="grain absolute inset-0" />
  </span>
);

/**
 * A media's still in the grid: the photo, a video's poster (it plays in the photo
 * viewer, not here), or its placeholder. A real photo keeps its own shape — reserved
 * before it loads when its `aspect` is known.
 */
export function MediaThumb({ item, index }: { item: MediaItem; index: number }) {
  const [failed, setFailed] = useState(false);
  const src = item.type === "video" ? item.poster : item.src;
  if (!src || failed) {
    return (
      <span className={clsx("relative block", PLACEHOLDER_RATIO[index % PLACEHOLDER_RATIO.length])}>
        <MediaPlaceholder index={index} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- placeholders for now; next/image once the real photos exist
    <img
      src={src}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      style={item.aspect ? { aspectRatio: item.aspect } : undefined}
      className="block w-full object-cover"
    />
  );
}

/** The media in the photo viewer: the photo, or the video with sound and controls. */
export function MediaFull({ item, index }: { item: MediaItem; index: number }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span className="relative block aspect-4/3 h-full max-h-full max-w-full overflow-hidden rounded-2xl shadow-photo">
        <MediaPlaceholder index={index} />
      </span>
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
      className="max-h-full max-w-full rounded-2xl shadow-photo"
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- placeholders for now; next/image once the real photos exist
    <img
      src={item.src}
      alt={item.caption ?? ""}
      onError={() => setFailed(true)}
      className="max-h-full max-w-full rounded-2xl object-contain shadow-photo"
    />
  );
}
