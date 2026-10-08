"use client";

import type { ReactNode } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import type { ShapeName } from "#/components/pages/home/book/dots/dots.types";

// The dots need the browser (a canvas, the figure's size): loaded there only, with the shapes.
const DotCanvas = dynamic(() => import("#/components/pages/home/book/dots/DotCanvas"), {
  ssr: false,
});

type Props = {
  shape: ShapeName;
  /** What the figure shows, for screen readers: the dots themselves are hidden from them. */
  label: string;
  /** Its place and size: `relative` (or `absolute`), and a size; the dots fill it. */
  className?: string;
  /** Drawn over the dots (the Lab's drawing). */
  children?: ReactNode;
};

/**
 * A figure of the calm book drawn in dots (P27-93): the star, Saturn, the Earth, the Lab's
 * Sun, the Milky Way. One image for screen readers, described by `label`; the pointer lights
 * the dots it touches, and nothing else moves.
 */
const DotField = ({ shape, label, className, children }: Props) => (
  <figure role="img" aria-label={label} className={clsx("m-0", className)}>
    <DotCanvas shape={shape} />
    {children}
  </figure>
);

export default DotField;
