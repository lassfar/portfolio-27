import type { Ref } from "react";

/** Where the timeline sits: any edge or corner of the screen. */
export type StoryTimelinePosition =
  | "top left"
  | "top center"
  | "top right"
  | "center left"
  | "center right"
  | "bottom left"
  | "bottom center"
  | "bottom right";

/** A colour from the design system (globals.css @theme), or "custom" (a hex of your own). */
export type StoryTimelineColor =
  | "peach"
  | "dark-peach"
  | "light-peach"
  | "baby-blue"
  | "light-baby-blue"
  | "gray-slate"
  | "dark"
  | "rich-black"
  | "custom";

/** Each chapter's mark on the rail. */
export type StoryTimelineShape = "star" | "circle" | "diamond" | "tick" | "orbit" | "capsule";

/** auto = horizontal at the top / bottom centre, vertical everywhere else. */
export type StoryTimelineOrientation = "auto" | "vertical" | "horizontal";

/** The timeline's tunables (TIMELINE in config.ts). The dev panel edits them live. */
export type StoryTimelineTuning = {
  position: StoryTimelinePosition;
  orientation: StoryTimelineOrientation;
  edge: number;
  railLength: number;
  railWidth: number;
  /** The fill, the passed + current stars, the glow and the focus ring. */
  color: StoryTimelineColor;
  customColor: string;
  /** The unfilled rail and the upcoming stars. */
  railColor: StoryTimelineColor;
  customRailColor: string;
  /** The tooltip + name pill's text. */
  tipColor: StoryTimelineColor;
  customTipColor: string;
  shape: StoryTimelineShape;
  /** Marks not reached yet: soft fills, or outlines (circle / diamond / capsule / orbit). */
  upcoming: "dim" | "hollow";
  starSize: number;
  currentSize: number;
  glow: number;
  pulse: boolean;
  railAlpha: number;
  upcomingAlpha: number;
  minGap: number;
  showAfter: number;
  dimAfter: number;
  dimOpacity: number;
  hideAfter: number;
  glideSeconds: number;
  glideInside: number;
  nameOnChange: boolean;
  nameSeconds: number;
  phoneMaxWidth: number;
};

/** One chapter of the story: a star on the timeline. */
export type StoryChapter = {
  id: string;
  name: string;
  /** Where the chapter starts on the pinned journey (master progress, 0..1). */
  start: number;
};

/** How the timeline rests when you stop scrolling (TIMELINE.dimAfter / hideAfter). */
export type StoryTimelineRest = "awake" | "dim" | "hidden";

/** A chapter's name popping up by its star as the chapter starts. */
export type StoryTimelineToast = {
  index: number;
  on: boolean;
};

export type StoryTimelineRailProps = {
  chapters: readonly StoryChapter[];
  /** Each chapter's place on the rail: 0 (its start: top / left) … 1 (its end). */
  positions: readonly number[];
  /** The chapter you're in. */
  current: number;
  /** How far the peach fill reaches (0..1), for a static render. The live timeline moves it through `fillRef`. */
  fill?: number;
  fillRef?: Ref<HTMLDivElement>;
  shown: boolean;
  /** After a moment without scrolling it dims, then (optionally) hides. */
  rest: StoryTimelineRest;
  /** Phones: no hover tooltips (the name pops up on change instead). */
  phone: boolean;
  toast?: StoryTimelineToast;
  onSelect?: (index: number) => void;
};
