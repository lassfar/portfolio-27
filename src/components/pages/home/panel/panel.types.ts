import type { LucideIcon } from "lucide-react";

/** A fact under a panel's title ("4 photos"). */
export type PanelTag = { icon: LucideIcon; label: string };

/** What a panel's header says (PanelHeader): the same parts for a place and for the Lab. */
export type PanelHeaderModel = {
  /** The line above the title: a place (in peach) and a detail ("51.51° N, 0.13° W"). */
  eyebrow: { place: string; detail: string };
  /** Its key word in peach, between asterisks. */
  title: string;
  /** A short quote. */
  blurb: string;
  tags: PanelTag[];
};
