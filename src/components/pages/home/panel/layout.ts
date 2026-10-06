import type { PanelView } from "#/stores/usePanelStore";

/**
 * The panel's shared layout classes (P27-80): one entry per view where the full view and
 * the side panel differ (typed maps, picked by the panel's view).
 */

/**
 * A part of the panel's entrance: marked parts rise in one after another, in page order,
 * on one GSAP timeline (ScenePanel, useRiseInMotion). Spread it on the part.
 */
export const RISE = { "data-rise": "" } as const;

/** A swash starts drawing this long after it starts rising in (it's on its way up by then). */
export const DRAW_AFTER_RISE = 0.18;

/** The content's swap (another place, or the other view): it fades out first (usePanelFrame). */
export const SWAP = "transition-[opacity,translate] duration-240 ease-out motion-reduce:transition-none";
export const SWAPPING = "translate-y-2 opacity-0";

/** The media (photos or experiments) under the header. */
export const MEDIA: Record<PanelView, string> = {
  full: "mt-9 w-full sm:mt-16",
  side: "mt-8 w-full",
};

/** The story's overlays (title, timeline, subtitles) step back while the full view is open. */
export const STEP_BACK_IN_FULL_VIEW = "transition-opacity duration-400 panel-full:opacity-0";
