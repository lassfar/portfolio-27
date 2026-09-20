/**
 * Projected screen position of each Earth pin, written every frame by the 3D
 * pins (EarthPins, inside the canvas — it has the camera) and read by the DOM
 * label overlay (PinLabels) on its own rAF loop. A plain mutable record rather
 * than a store, so per-frame updates don't trigger React re-renders.
 *
 * Keyed by PhotoLocation.id. `shown` is true only when the pin is front-facing
 * and the Earth is in full view (see EARTH.pinLabelsAt). x/y are CSS pixels.
 */
export type PinScreen = { x: number; y: number; shown: boolean };

export const pinScreen: Record<string, PinScreen> = {};
