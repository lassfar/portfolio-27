import type { ComponentPropsWithRef } from "react";

/** `soft`: a name (light peach, a white hairline); `peach`: a live reading (peach, a peach hairline). */
export type QuietLabelTone = "soft" | "peach";

export interface QuietLabelProps extends ComponentPropsWithRef<"span"> {
  tone?: QuietLabelTone;
  /** Places it (e.g. anchored to a point in the scene) and adds its own states (a hover). */
  className?: string;
}
