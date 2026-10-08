import clsx from "clsx";
import type { CSSProperties } from "react";
import Tooltip from "#/components/UI/tooltip/Tooltip";
import type { TooltipSide } from "#/components/UI/tooltip/tooltip.types";
import { TIMELINE } from "./tuning";
import { fillClip, RAIL_CLEAR, railLayout, STAR_SPACING } from "./layout";
import type {
  StoryTimelineColor,
  StoryTimelineRailProps,
  StoryTimelineTuning,
} from "./StoryTimeline.types";

/** A design-system colour's token (globals.css @theme), or the custom hex. */
const tone = (color: StoryTimelineColor, custom: string) =>
  color === "custom" ? custom : `var(--color-${color})`;

/**
 * The tuned values as the custom properties the `.story-timeline` styles read
 * (globals.css). Read on every render, so dev-panel edits (TimelineGui) show at once.
 */
const railVars = (t: StoryTimelineTuning, horizontal: boolean, count: number): CSSProperties =>
  ({
    "--tl-length": railLength(t, horizontal, count),
    "--tl-color": tone(t.color, t.customColor),
    "--tl-rail-color": tone(t.railColor, t.customRailColor),
    "--color-tooltip": tone(t.tipColor, t.customTipColor), // its tooltips' text
    "--tl-rail": `${t.railWidth}px`,
    "--tl-star": `${t.starSize}px`,
    "--tl-current": `${t.currentSize}px`,
    "--tl-glow": t.glow,
    "--tl-rail-alpha": t.railAlpha,
    "--tl-upcoming-alpha": t.upcomingAlpha,
    "--tl-dim": t.dimOpacity,
  }) as CSSProperties;

/**
 * Its share of the screen, but long enough to space its stars; a vertical one within the room
 * it leaves for the switch (railPxFor).
 */
function railLength(t: StoryTimelineTuning, horizontal: boolean, count: number): string {
  const wanted = `max(${t.railLength}${horizontal ? "vw" : "vh"}, ${(count - 1) * STAR_SPACING}px)`;
  if (horizontal) return wanted;
  return `min(${wanted}, calc(100dvh - ${RAIL_CLEAR.top + RAIL_CLEAR.bottom}px))`;
}

/** The name pill's spot: 24px into the screen from the rail (it opens 6px past it, like a tooltip). */
const PILL_SPOT: Record<TooltipSide, string> = {
  right: "left-6",
  left: "right-6",
  below: "top-6",
  above: "bottom-6",
};

/**
 * The story timeline's look: a thin rail on any edge or corner of the screen
 * (TIMELINE.position, vertical or horizontal) that fills as you go, with one small
 * four-point star per chapter.
 * - Passed stars and the fill are a warm grey; the current one is bigger and glows; stars not
 *   reached yet show softly (TIMELINE.upcomingAlpha). Every mark is 3:1 or more (P27-97).
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
  tuning = TIMELINE,
  announce = true,
}: StoryTimelineRailProps) => {
  const { horizontal, tip, place } = railLayout(tuning);
  const along = horizontal ? "left" : "top"; // places things along the rail
  return (
    <nav
      aria-label="Story timeline"
      className={clsx(
        "story-timeline",
        horizontal ? "is-horizontal" : "is-vertical",
        `shape-${tuning.shape}`,
        tuning.upcoming === "hollow" && "is-hollow",
        shown && "is-shown",
        rest !== "awake" && "is-idle",
        rest === "hidden" && "is-asleep",
        phone && "is-phone",
        tuning.pulse && "is-pulse",
      )}
      style={{ ...railVars(tuning, horizontal, chapters.length), ...place }}
    >
      <div className="story-timeline__rail" />
      <div
        ref={fillRef}
        className="story-timeline__fill"
        style={{ clipPath: fillClip(fill, horizontal) }}
      />
      <ol className="story-timeline__list">
        {chapters.map((chapter, i) => (
          <li
            key={chapter.id}
            className="story-timeline__item"
            style={{ [along]: `${positions[i] * 100}%` }}
          >
            <button
              type="button"
              className={clsx(
                "story-timeline__star group/tip",
                i < current && "is-passed",
                i === current && "is-current",
              )}
              aria-label={chapter.name}
              aria-current={i === current ? "step" : undefined}
              onClick={() => onSelect?.(i)}
            >
              <span className="story-timeline__glyph" aria-hidden="true" />
              {!phone && <Tooltip side={tip}>{chapter.name}</Tooltip>}
            </button>
          </li>
        ))}
      </ol>
      {/* The chapter's name as it changes, by its star. */}
      <div
        className={clsx("absolute size-0", PILL_SPOT[tip])}
        style={{ [along]: `${(positions[toast?.index ?? current] ?? 0) * 100}%` }}
      >
        <Tooltip side={tip} open={toast?.on ?? false} live={announce}>
          {toast ? chapters[toast.index]?.name : ""}
        </Tooltip>
      </div>
    </nav>
  );
};

export default StoryTimelineRail;
