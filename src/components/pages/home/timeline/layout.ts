import type { CSSProperties } from "react";
import type { TooltipSide } from "#/components/UI/tooltip/tooltip.types";
import type { StoryChapter, StoryTimelineTuning } from "./StoryTimeline.types";

/** The rail's direction, placement on screen, and the side its tooltips open on. */
export type RailLayout = {
  horizontal: boolean;
  /** Tooltips + the name pill open toward the inside of the screen. */
  tip: TooltipSide;
  place: CSSProperties;
};

/** The rail's hit area across it (px): the stars' 24px buttons, centred on the line. */
const HIT = 24;

/**
 * The room a vertical rail leaves at the screen's top and bottom (px, P27-95). At the top, the
 * Reduce motion switch's corner (MotionSwitch: 24px down, 40px tall, a 44px tap area) and the
 * top star's own tap area below it; at the bottom, a margin. On a short screen (a phone held
 * sideways) the rail starts below the switch, not under it.
 */
export const RAIL_CLEAR = { top: 88, bottom: 16 } as const;

/**
 * Where the rail sits (TIMELINE.position / orientation / edge / railLength). `edge` is
 * measured to the rail LINE on the side it runs along (0 = the line flush with the
 * screen edge; the stars' hit area may overhang it), and to the rail's end otherwise.
 */
export function railLayout(t: StoryTimelineTuning): RailLayout {
  const [v, h] = t.position.split(" ");
  const horizontal = t.orientation === "horizontal" || (t.orientation === "auto" && h === "center");
  const line = `${t.edge - HIT / 2 + t.railWidth / 2}px`; // the hit area's offset that puts the line at `edge`
  const end = `${t.edge}px`;
  const place: CSSProperties = {};
  let tx = "0";
  let ty = "0";
  if (v === "top") place.top = horizontal ? line : end;
  else if (v === "bottom") place.bottom = horizontal ? line : end;
  else if (horizontal) [place.top, ty] = ["50%", "-50%"];
  // Centred, but below the switch's corner on a short screen.
  else [place.top, ty] = [`max(50%, calc(${RAIL_CLEAR.top}px + var(--tl-length) / 2))`, "-50%"];
  if (h === "left") place.left = horizontal ? end : line;
  else if (h === "right") place.right = horizontal ? end : line;
  else [place.left, tx] = ["50%", "-50%"];
  place.transform = `translate(${tx}, ${ty})`;
  const tip = horizontal ? (v === "bottom" ? "above" : "below") : h === "right" ? "left" : "right";
  return { horizontal, tip, place };
}

/**
 * Phones and touch screens (P27-95): no hover, so no names on hover; a new chapter's name
 * pops up by its star instead. Narrow screens, and any without hover (a landscape phone, a
 * tablet).
 */
export const phoneQuery = (t: StoryTimelineTuning) =>
  `(max-width: ${t.phoneMaxWidth}px), (hover: none)`;

/**
 * The stars' spacing wanted (px, P27-95): their 24px buttons 32px apart, so on a short screen
 * (a phone held sideways) they don't touch (WCAG 2.5.8). Closer only where the rail can't fit it
 * (railPxFor).
 */
export const STAR_SPACING = 32;

/**
 * The rail's length (px) on a screen `screenPx` along it: its share, but long enough to space
 * `count` stars. A vertical one fits the room it leaves (RAIL_CLEAR): on a screen that short,
 * its stars come closer.
 */
export function railPxFor(t: StoryTimelineTuning, screenPx: number, count: number): number {
  const wanted = Math.max((screenPx * t.railLength) / 100, (count - 1) * STAR_SPACING);
  if (railLayout(t).horizontal) return wanted;
  return Math.min(wanted, screenPx - RAIL_CLEAR.top - RAIL_CLEAR.bottom);
}

/**
 * Each chapter's place on the rail (0 = top … 1 = bottom): its share of the story's
 * scroll, but never closer to its neighbours than `minGap` px on a rail `railPx` tall.
 * That way a short chapter (the Earth's dwell) doesn't bunch into the next star.
 */
export function chapterPositions(
  chapters: readonly StoryChapter[],
  minGap: number,
  railPx: number,
): number[] {
  const n = chapters.length;
  if (n < 2) return chapters.map(() => 0);
  const last = chapters[n - 1].start;
  const pos = chapters.map((c) => (last > 0 ? c.start / last : 0));
  const gap = railPx > 0 ? Math.min(minGap / railPx, 1 / (n - 1)) : 1 / (n - 1);
  for (let i = 1; i < n; i++) pos[i] = Math.max(pos[i], pos[i - 1] + gap);
  pos[n - 1] = Math.min(pos[n - 1], 1);
  for (let i = n - 2; i >= 0; i--) pos[i] = Math.min(pos[i], pos[i + 1] - gap);
  return pos;
}

/** The chapter you're in at master progress `mp`. */
export function chapterAt(chapters: readonly StoryChapter[], mp: number): number {
  let i = chapters.length - 1;
  while (i > 0 && mp < chapters[i].start) i--;
  return i;
}

/** How far the fill reaches at `mp`: through each chapter's gap, at that chapter's own pace. */
export function fillAt(
  chapters: readonly StoryChapter[],
  positions: readonly number[],
  mp: number,
): number {
  const i = chapterAt(chapters, mp);
  const next = chapters[i + 1];
  if (!next) return 1;
  const t = Math.min(1, Math.max(0, (mp - chapters[i].start) / (next.start - chapters[i].start)));
  return positions[i] + (positions[i + 1] - positions[i]) * t;
}

/**
 * The fill shown as far as `fill` (0..1) along the rail: the whole rail, clipped with round
 * ends (P27-86). Resizing it would cost a layout on every scroll frame; a clip doesn't.
 */
export function fillClip(fill: number, horizontal: boolean): string {
  const rest = `${(1 - fill) * 100}%`;
  return horizontal ? `inset(0 ${rest} 0 0 round 9999px)` : `inset(0 0 ${rest} 0 round 9999px)`;
}
