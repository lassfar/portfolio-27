/**
 * Projected screen position of the Voyager's Golden Record, written every frame
 * by the 3D craft (Voyager, inside the canvas — it has the camera) once the camera
 * has moved (LABEL_PRIORITY), then applied by the DOM label overlay (RecordLabel) in
 * that same step (`recordLabel.update`). A plain mutable record rather than a store,
 * so per-frame updates don't trigger React re-renders (mirrors `earth/pinScreen.ts`).
 *
 * `shown` is true only when the record is in front of the camera and the Lab is
 * in full view (see LAB.recordLabelAt). x/y are CSS pixels.
 */
export type RecordScreen = {
  x: number;
  y: number;
  shown: boolean;
  /** What it labels: the Parker Solar Probe's marker (from afar) or its memory card. */
  text: "probe" | "card";
};

export const recordScreen: RecordScreen = { x: 0, y: 0, shown: false, text: "card" };

/** The DOM overlay's per-frame update — set by RecordLabel, called by the Voyager
 *  right after the record is projected (same frame, before it's drawn). */
export const recordLabel: { update: (() => void) | null } = { update: null };
