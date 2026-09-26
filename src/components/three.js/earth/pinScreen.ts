/**
 * Projected screen position of each Earth pin, written every frame by the 3D
 * pins (EarthPins, inside the canvas — it has the camera) once the camera has moved
 * (LABEL_PRIORITY), then applied by the DOM label overlay (PinLabels) in that same
 * step (`pinLabels.update`). A plain mutable record rather than a store, so
 * per-frame updates don't trigger React re-renders.
 *
 * Keyed by PhotoLocation.id. `shown` is true only when the pin is front-facing
 * and the Earth is in full view (see EARTH.pinLabelsAt). x/y are CSS pixels.
 */
export type PinScreen = { x: number; y: number; shown: boolean };

export const pinScreen: Record<string, PinScreen> = {};

/** The DOM overlay's per-frame update — set by PinLabels, called by EarthPins right
 *  after the pins are projected (same frame, before it's drawn). */
export const pinLabels: { update: (() => void) | null } = { update: null };
