import clsx from "clsx";
import type { CSSProperties } from "react";
import { TIMELINE } from "./config";
import { railLayout } from "./layout";
import type { StoryTimelineColor, StoryTimelineRailProps } from "./StoryTimeline.types";

/** A design-system colour's token (globals.css @theme), or the custom hex. */
const tone = (color: StoryTimelineColor, custom: string) =>
  color === "custom" ? custom : `var(--color-${color})`;

/**
 * The tuned values as the custom properties the `.story-timeline` styles read
 * (globals.css). Read on every render, so dev-panel edits (TimelineGui) show at once.
 */
const railVars = (horizontal: boolean): CSSProperties =>
  ({
    "--tl-length": `${TIMELINE.railLength}${horizontal ? "vw" : "vh"}`,
    "--tl-color": tone(TIMELINE.color, TIMELINE.customColor),
    "--tl-rail-color": tone(TIMELINE.railColor, TIMELINE.customRailColor),
    "--tl-tip-color": tone(TIMELINE.tipColor, TIMELINE.customTipColor),
    "--tl-rail": `${TIMELINE.railWidth}px`,
    "--tl-star": `${TIMELINE.starSize}px`,
    "--tl-current": `${TIMELINE.currentSize}px`,
    "--tl-glow": TIMELINE.glow,
    "--tl-rail-alpha": TIMELINE.railAlpha,
    "--tl-upcoming-alpha": TIMELINE.upcomingAlpha,
    "--tl-dim": TIMELINE.dimOpacity,
  }) as CSSProperties;

/**
 * The story timeline's look: a thin rail on any edge or corner of the screen
 * (TIMELINE.position, vertical or horizontal) that fills with peach, with one small
 * four-point star per chapter.
 * - Passed stars are peach; the current one is bigger and glows; stars not reached yet
 *   stay hidden until you get there (TIMELINE.upcomingAlpha).
 * - Each star names its chapter on hover / keyboard focus, and clicking it calls
 *   `onSelect`.
 *
 * Presentational only: StoryTimeline drives it from the scroll.
 */
const StoryTimelineRail = ({
  chapters,
  positions,
  current,
  fill = 0,
  fillRef,
  shown,
  rest,
  phone,
  toast,
  onSelect,
}: StoryTimelineRailProps) => {
  const { horizontal, tip, place } = railLayout(TIMELINE);
  const along = horizontal ? "left" : "top"; // places things along the rail
  return (
  <nav
    aria-label="Story timeline"
    className={clsx(
      "story-timeline",
      horizontal ? "is-horizontal" : "is-vertical",
      `tip-${tip}`,
      `shape-${TIMELINE.shape}`,
      TIMELINE.upcoming === "hollow" && "is-hollow",
      shown && "is-shown",
      rest !== "awake" && "is-idle",
      rest === "hidden" && "is-asleep",
      phone && "is-phone",
      TIMELINE.pulse && "is-pulse",
    )}
    style={{ ...railVars(horizontal), ...place }}
  >
    <div className="story-timeline__rail" />
    <div
      ref={fillRef}
      className="story-timeline__fill"
      style={{ [horizontal ? "width" : "height"]: `${fill * 100}%` }}
    />
    <ol className="story-timeline__list">
      {chapters.map((chapter, i) => (
        <li key={chapter.id} className="story-timeline__item" style={{ [along]: `${positions[i] * 100}%` }}>
          <button
            type="button"
            className={clsx("story-timeline__star", i < current && "is-passed", i === current && "is-current")}
            aria-label={chapter.name}
            aria-current={i === current ? "step" : undefined}
            onClick={() => onSelect?.(i)}
          >
            <span className="story-timeline__glyph" aria-hidden="true" />
            <span className="story-timeline__tip" aria-hidden="true">
              {chapter.name}
            </span>
          </button>
        </li>
      ))}
    </ol>
    <div
      className={clsx("story-timeline__toast", toast?.on && "is-on")}
      style={{ [along]: `${(positions[toast?.index ?? current] ?? 0) * 100}%` }}
      aria-live="polite"
    >
      {toast ? chapters[toast.index]?.name : ""}
    </div>
  </nav>
  );
};

export default StoryTimelineRail;
