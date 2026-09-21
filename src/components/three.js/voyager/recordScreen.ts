/**
 * Projected screen position of the Voyager's Golden Record, written every frame
 * by the 3D craft (Voyager, inside the canvas — it has the camera) and read by
 * the DOM label overlay (RecordLabel) on its own rAF loop. A plain mutable record
 * rather than a store, so per-frame updates don't trigger React re-renders
 * (mirrors `earth/pinScreen.ts`).
 *
 * `shown` is true only when the record is in front of the camera and the Lab is
 * in full view (see LAB.recordLabelAt). x/y are CSS pixels.
 */
export type RecordScreen = { x: number; y: number; shown: boolean };

export const recordScreen: RecordScreen = { x: 0, y: 0, shown: false };
