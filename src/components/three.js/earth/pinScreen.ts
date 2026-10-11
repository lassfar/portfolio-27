/**
 * Projected screen position of each Earth pin, written every frame by the 3D
 * pins (EarthPins, inside the canvas — it has the camera) once the camera has moved
 * (LABEL_PRIORITY), then applied by the DOM label overlay (PinLabels) in that same
 * step (`pinLabels.update`). A plain mutable record rather than a store, so
 * per-frame updates don't trigger React re-renders.
 *
 * Keyed by PhotoLocation.id. `shown` is true only when the pin is front-facing
 * and the Earth is in full view (see EARTH.pinLabelsAt); `near`, on either side of the globe
 * while it's in full view: its label can be reached by keyboard then (P27-99). x/y are CSS
 * pixels.
 */
export type PinScreen = { x: number; y: number; shown: boolean; near: boolean };

export const pinScreen: Record<string, PinScreen> = {};

/** The DOM overlay's per-frame update — set by PinLabels, called by EarthPins right
 *  after the pins are projected (same frame, before it's drawn). */
export const pinLabels: { update: (() => void) | null } = { update: null };

/** The place whose pin is lit (hovered, or its label is): set by the pins and the labels,
 *  read by the pins every frame. A plain record, like `pinScreen`. */
export const pinHover: { id: string | null } = { id: null };

/** A place to turn round to face the camera: its label took the keyboard's focus on the globe's
 *  far side (P27-99). Set by the labels, taken by the globe (DottedEarth) on its next frame. */
export const pinTurn: { id: string | null } = { id: null };
