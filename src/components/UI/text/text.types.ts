import type { ComponentPropsWithRef } from "react";

export const DISPLAY_TITLE_SIZES = [
  "hero",
  "xl",
  "lg",
  "md",
  "sm",
  "chapter",
  "panel",
  "panel-side",
] as const;
/** Its size ladder across breakpoints: the hero's headline, the sections' titles (xl → sm), a calm book chapter's, a panel's title. */
export type DisplayTitleSize = (typeof DISPLAY_TITLE_SIZES)[number];

export interface DisplayTitleProps extends Omit<ComponentPropsWithRef<"h2">, "children"> {
  /** Its words; those between asterisks (`*Small Universes*`) are its key words, in peach. */
  text: string;
  /** Its heading level (h2 by default). */
  as?: "h1" | "h2" | "h3";
  size: DisplayTitleSize;
  /** Read before its words, not shown: what it heads (a chapter's name, P27-95), so heading navigation says it. */
  srPrefix?: string;
  /** Places it. */
  className?: string;
}
