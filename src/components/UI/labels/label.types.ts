import type { ComponentPropsWithRef } from "react";

export const QUIET_LABEL_TONES = ["soft", "peach"] as const;
/** `soft`: a name (light peach, a white hairline); `peach`: a live reading (peach, a peach hairline). */
export type QuietLabelTone = (typeof QUIET_LABEL_TONES)[number];

export interface QuietLabelProps extends ComponentPropsWithRef<"span"> {
  tone?: QuietLabelTone;
  /** Places it (e.g. anchored to a point in the scene) and adds its own states (a hover). */
  className?: string;
}
