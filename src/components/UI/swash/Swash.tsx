"use client";

import clsx from "clsx";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { SWASHES, type SwashLength, type SwashName } from "./shapes";
import { orientPath } from "./orient";
import { drawSwash, hideSwash } from "./drawSwash";

/**
 * When it draws itself in (drawSwash, GSAP): as it appears, after `delay` (`mount`), or
 * when the page draws it (`cue`: hidden until then, e.g. its title's write-in ends).
 */
export type SwashDraw = "mount" | "cue";

/** Never wider than its box (300 / 600): the line stays as fine as the first swash's. */
const MAX_WIDTH: Record<SwashLength, string> = {
  short: "max-w-75",
  long: "max-w-150",
};

export interface SwashProps {
  shape?: SwashName;
  /** Mirrored left ⇄ right (it still draws from the left). */
  flipX?: boolean;
  /** Upside down. */
  flipY?: boolean;
  draw?: SwashDraw;
  /** Seconds before it draws (`mount`): its place in the content's stagger. */
  delay?: number;
  /** Its width (capped by its set; its height follows its shape) and placement. */
  className?: string;
}

/**
 * A hand-drawn swash under a title (P27-80, P27-83): one of Aymane's pen strokes in
 * peach, drawing itself in (drawSwash: its path's length is 1, its dash moves from hidden
 * to drawn). With `draw="cue"` the page draws it, in its own timeline. Decorative.
 *
 * Its line is 1.5 units of its box (300 wide, or 600 for a long one), so it would
 * thicken past that width: it's capped there, for the fine line of the first one.
 */
const Swash = ({
  shape = "loopEnd",
  flipX = false,
  flipY = false,
  draw = "mount",
  delay = 0,
  className,
}: SwashProps) => {
  const ref = useRef<SVGSVGElement>(null);
  const swash = SWASHES[shape];
  const { viewBox } = swash;
  const d = orientPath(swash, { flipX, flipY });
  useGSAP(
    () => {
      if (draw === "mount") drawSwash(ref.current, delay);
      else hideSwash(ref.current);
    },
    // (A new shape, delay or mode first undoes the last draw: one tween per line.)
    { dependencies: [draw, delay, d], revertOnUpdate: true },
  );
  return (
    <svg
      ref={ref}
      viewBox={viewBox}
      aria-hidden="true"
      data-swash={shape}
      className={clsx(
        "block h-auto overflow-visible text-peach",
        MAX_WIDTH[swash.length],
        className,
      )}
    >
      <path
        pathLength={1}
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1 2"
        className="opacity-85"
      />
    </svg>
  );
};

export default Swash;
