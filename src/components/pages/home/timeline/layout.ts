import type { CSSProperties } from "react";
import type { StoryChapter, StoryTimelineTuning } from "./StoryTimeline.types";

/** The rail's direction, placement on screen, and the side its tooltips open on. */
export type RailLayout = {
  horizontal: boolean;
  /** Tooltips + the name pill open toward the inside of the screen. */
  tip: "right" | "left" | "below" | "above";
  place: CSSProperties;
};

/** The rail's hit area across it (px): the stars' 24px buttons, centred on the line. */
const HIT = 24;

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
  else [place.top, ty] = ["50%", "-50%"];
  if (h === "left") place.left = horizontal ? end : line;
  else if (h === "right") place.right = horizontal ? end : line;
  else [place.left, tx] = ["50%", "-50%"];
  place.transform = `translate(${tx}, ${ty})`;
  const tip = horizontal ? (v === "bottom" ? "above" : "below") : h === "right" ? "left" : "right";
  return { horizontal, tip, place };
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
