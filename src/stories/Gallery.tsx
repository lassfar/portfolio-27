import clsx from "clsx";
import type { ReactNode } from "react";

type GalleryLayout = "row" | "stack";

const LAYOUT: Record<GalleryLayout, { root: string; item: string }> = {
  row: { root: "flex flex-wrap items-end gap-x-14 gap-y-10", item: "items-center" },
  stack: { root: "flex flex-col gap-12", item: "items-start" },
};

interface GalleryProps<T extends string> {
  /** One prop's values: each is rendered and captioned with its name. */
  values: readonly T[];
  children: (value: T) => ReactNode;
  /** `stack` for wide items (titles, swashes); `row` otherwise. */
  layout?: GalleryLayout;
}

/**
 * A story's gallery (P27-82): every value of one prop (sizes, sides, tones…) side by side,
 * each captioned — so a closed set is one story, however many values it has, and they're
 * easy to compare. The rest of the story's args still apply (Controls).
 */
const Gallery = <T extends string>({ values, children, layout = "row" }: GalleryProps<T>) => (
  <div className={LAYOUT[layout].root}>
    {values.map((value) => (
      <figure key={value} className={clsx("flex flex-col gap-3", LAYOUT[layout].item)}>
        {children(value)}
        <figcaption className="text-2xs tracking-wide text-white/55">{value}</figcaption>
      </figure>
    ))}
  </div>
);

export default Gallery;
