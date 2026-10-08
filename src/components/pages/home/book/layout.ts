/*
 * The calm book's type and parts (P27-93), as the agreed prototype draws them
 * (docs/design/mockups/14-calm-story.html).
 */

/** A part that fades in the first time it shows (BookReveal): opacity only, nothing moves. */
export const REVEAL = "opacity-0 transition-opacity duration-500 ease-out data-in:opacity-100";

/** The small capitals over the words: "Chapter 2 · The Maker". */
export const EYEBROW = "font-krone-one text-[10px] tracking-[2.2px] text-white/55 uppercase";

/** A line in Aymane's voice, set off by a peach rule. */
export const VOICE_LINE =
  "border-l-2 border-peach/55 pl-3.5 text-[clamp(15px,1.4vw,17px)] leading-[1.7] text-white/92";

/** A chapter's words. */
export const BODY =
  "mb-3.5 max-w-140 text-[clamp(15.5px,1.35vw,17.5px)] leading-[1.85] text-white/80";

/** A bridge's line, in the display face. */
export const BRIDGE_LINE =
  "max-w-160 font-great-vibes text-[clamp(28px,3.4vw,40px)] leading-[1.25] text-white/88";

/** A chapter's figure: 5:4, the shape filling it. */
export const FIGURE = "relative aspect-5/4 w-full";
