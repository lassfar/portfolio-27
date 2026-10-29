"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import type { MediaItem } from "#/components/three.js/earth/data";
import { useCalm } from "#/stores/useMotion";

/** Where each placeholder's soft light sits (varied, so a grid of them has some rhythm). */
const PLACEHOLDER_LIGHT = [
  "bg-radial-[70%_55%_at_30%_25%] from-light-peach/16",
  "bg-radial-[70%_55%_at_70%_40%] from-peach/14",
  "bg-radial-[70%_55%_at_45%_75%] from-light-baby-blue/12",
] as const;

/** The placeholders' shapes in a grid (a real photo has its own, or its `aspect`). */
export const PLACEHOLDER_RATIO = [
  "aspect-4/5",
  "aspect-square",
  "aspect-3/4",
  "aspect-4/3",
  "aspect-5/6",
] as const;

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
    <span className="absolute inset-0 grain" />
  </span>
);

/**
 * A card's width, for the browser to pick a photo's size (P27-106): half the screen on a
 * phone (two columns); from `sm`, the side panel's two columns (222 px at 1440 px wide) or
 * the full view's three (317 px at 1440: a third of the screen, ~320 px at most).
 */
export const GRID_SIZES = {
  side: "(min-width: 640px) 240px, 50vw",
  full: "(min-width: 640px) min(33vw, 320px), 50vw",
} as const;

/**
 * The viewer's photo: the screen's width, or less where its height holds a 3:2 photo back (the
 * close button, the arrows' row and the caption take ~240 px of it).
 */
const VIEWER_SIZES = "min(100vw, calc((100vh - 240px) * 1.5))";

/** A real photo: its master's size is known, so next/image can optimize it (P27-106). */
const isPhoto = (item: MediaItem): item is MediaItem & { width: number; height: number } =>
  item.type === "image" && !!item.width && !!item.height;

/**
 * A media's still in the grid: the photo, a video's poster (it plays in the photo
 * viewer, not here), or its placeholder. A real photo goes through next/image: the size
 * this screen needs in AVIF or WebP, its shape held and its blurred copy shown until it
 * loads. Inside its card's button it's `alt=""`: the button's name ("Open …") says it.
 */
export function MediaThumb({
  item,
  index,
  sizes = GRID_SIZES.full,
}: {
  item: MediaItem;
  index: number;
  /** The card's width on screen (`GRID_SIZES`). */
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = item.type === "video" ? item.poster : item.src;
  if (isPhoto(item) && !failed) {
    return (
      <Image
        src={item.src}
        width={item.width}
        height={item.height}
        sizes={sizes}
        placeholder={item.blur ? "blur" : "empty"}
        blurDataURL={item.blur}
        alt=""
        onError={() => setFailed(true)}
        className="block h-auto w-full object-cover"
      />
    );
  }
  if (!src || failed) {
    return (
      <span className={clsx("relative block", PLACEHOLDER_RATIO[index % PLACEHOLDER_RATIO.length])}>
        <MediaPlaceholder index={index} />
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a placeholder's or a clip's poster: no known size to optimize
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

/**
 * The media in the photo viewer: the photo, or the video with sound and controls (it
 * stops when the viewer closes: `playing`). In calm motion a clip doesn't start on its own
 * or loop: it waits on its poster for play (WCAG 2.2.2, P27-92). Its placeholder fits the viewer's size
 * container at 4:3. Its photo or clip is capped in container units too: the viewer's grid row
 * grows to fit its content, so a percentage cap (`max-h-full`) would let a tall photo spill.
 * A real photo (next/image) loads first (`fetchPriority`), at the size it shows at, named by
 * its `alt`: what it shows, while its caption under it tells the story.
 */
export function MediaFull({
  item,
  index,
  playing,
}: {
  item: MediaItem;
  index: number;
  playing: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const calm = useCalm();
  useEffect(() => {
    if (!playing) video.current?.pause();
  }, [playing]);
  if (failed) {
    return (
      // The largest 4:3 box that fits (container units: the viewer's media area).
      <span className="relative block aspect-4/3 w-[min(100cqw,133.33cqh)] overflow-hidden rounded-2xl shadow-photo">
        <MediaPlaceholder index={index} />
      </span>
    );
  }
  if (isPhoto(item)) {
    return (
      <Image
        src={item.src}
        width={item.width}
        height={item.height}
        sizes={VIEWER_SIZES}
        loading="eager"
        fetchPriority="high"
        placeholder={item.blur ? "blur" : "empty"}
        blurDataURL={item.blur}
        alt={item.alt ?? ""}
        onError={() => setFailed(true)}
        className="h-auto max-h-[100cqh] w-auto max-w-[100cqw] rounded-2xl object-contain shadow-photo"
      />
    );
  }
  return item.type === "video" ? (
    <video
      ref={video}
      src={item.src}
      poster={item.poster}
      controls
      autoPlay={!calm}
      loop={!calm}
      playsInline
      onError={() => setFailed(true)}
      className="max-h-[100cqh] max-w-[100cqw] rounded-2xl shadow-photo"
    />
  ) : (
    // eslint-disable-next-line @next/next/no-img-element -- a placeholder (no file yet): no known size to optimize
    <img
      src={item.src}
      alt="" // its caption, under it in the viewer, stands in (and is said with its number)
      onError={() => setFailed(true)}
      className="max-h-[100cqh] max-w-[100cqw] rounded-2xl object-contain shadow-photo"
    />
  );
}
