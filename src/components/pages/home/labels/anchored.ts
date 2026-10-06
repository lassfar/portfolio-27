/**
 * A scene label's anchoring: fixed to the screen's corner and moved onto its point by an
 * inline `transform` every frame (its overlay's `update`), hidden until it's shown
 * (inline opacity / pointer-events). Over the story's overlays (z-45), under the panel (z-50).
 */
export const ANCHORED =
  "fixed left-0 top-0 z-45 pointer-events-none opacity-0 will-change-[transform,opacity]";
