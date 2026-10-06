import type { ComponentPropsWithRef } from "react";

/** Its size ladder across breakpoints: the hero's headline, the sections' titles (xl → sm), a panel's title. */
export type DisplayTitleSize = "hero" | "xl" | "lg" | "md" | "sm" | "panel" | "panel-side";

export interface DisplayTitleProps extends Omit<ComponentPropsWithRef<"h2">, "children"> {
  /** Its words; those between asterisks (`*Small Universes*`) are its key words, in peach. */
  text: string;
  /** Its heading level (h2 by default). */
  as?: "h1" | "h2" | "h3";
  size: DisplayTitleSize;
  /** Places it. */
  className?: string;
}
