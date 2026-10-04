/**
 * Projected screen positions of the markers on Parker's journey line (P27-72) — the
 * launch, then the 7 Venus flybys — written every frame by the 3D line (ParkerJourney)
 * once the camera has moved (LABEL_PRIORITY), then applied by the DOM labels
 * (JourneyLabels) in that same step (`journeyLabels.update`). A plain mutable record
 * rather than a store, so per-frame updates don't re-render (mirrors `earth/pinScreen`).
 *
 * The flybys repeat at the same spots of Venus's orbit (1 & 2, 3 & 4, 5 & 6): a spot
 * has one label, on its first marker, naming every flyby the line has reached there.
 */
export type JourneyMarkerScreen = {
  x: number;
  y: number;
  shown: boolean;
  /** The markers the line has reached at this spot, as bits (1 << marker index). */
  here: number;
};

export const journeyScreen = {
  markers: Array.from({ length: 8 }, (_, i): JourneyMarkerScreen => ({ x: 0, y: 0, shown: false, here: 1 << i })),
  /** The line has reached today (the probe's label then reads "· Today"). */
  today: false,
};

/** The DOM overlay's per-frame update — set by JourneyLabels, called by the line. */
export const journeyLabels: { update: (() => void) | null } = { update: null };
