import type { CSSProperties } from "react";
import type { PanelView } from "#/stores/usePanelStore";

/**
 * The panel's shared layout classes (P27-80): one entry per view where the full view and
 * the side panel differ (typed maps, picked by the panel's view).
 */

/** A part rising in as the panel opens (its delay from `riseAt`). */
export const RISE = "motion-safe:animate-rise";

/** Each part rises 60ms after the one before it (capped, so long lists don't wait). */
export const riseAt = (order: number): CSSProperties => ({
  animationDelay: `${Math.min(order, 12) * 60}ms`,
});

/** The header's parts take the first rises (eyebrow, title, swash, quote, tags, places). */
export const RISE_AFTER_HEADER = 6;

/** The media (photos or experiments) under the header. */
export const MEDIA: Record<PanelView, string> = {
  full: "mt-9 w-full sm:mt-16",
  side: "mt-8 w-full",
};

/** The story's overlays (title, timeline, subtitles) step back while the full view is open. */
export const STEP_BACK_IN_FULL_VIEW = "transition-opacity duration-400 panel-full:opacity-0";
