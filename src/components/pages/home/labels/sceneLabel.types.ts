import type { ButtonHTMLAttributes, Ref } from "react";
import type { LucideIcon } from "lucide-react";

export const SCENE_LABEL_TONES = ["place", "card"] as const;
/** A place (light peach) or Parker's memory card (peach). */
export type SceneLabelTone = (typeof SCENE_LABEL_TONES)[number];

export interface SceneLabelProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  ref?: Ref<HTMLButtonElement>;
  /** What it names (a camera for a place, a memory card for the Lab). */
  icon: LucideIcon;
  name: string;
  /** What it opens: "5 shots", "open the Lab". */
  meta: string;
  tone?: SceneLabelTone;
  /** Breathing (a peach ring) until the first panel is opened. */
  fresh?: boolean;
  /** The key of the panel it opens (`data-scene-label`): focus comes back to it on close. */
  labelKey: string;
}
