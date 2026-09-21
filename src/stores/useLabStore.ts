import { create } from "zustand";

/**
 * Bridges the 3D Voyager's Golden Record (inside the R3F canvas) to the DOM
 * experiments overlay. Clicking the record calls `openPanel()`; the experiments
 * panel reads `open`. Kept in a store so the WebGL and DOM layers stay decoupled
 * (mirrors useGalleryStore for the Earth gallery).
 */
type LabState = {
  /** Whether the experiments side panel is open. */
  open: boolean;
  openPanel: () => void;
  close: () => void;
};

export const useLabStore = create<LabState>((set) => ({
  open: false,
  openPanel: () => set({ open: true }),
  close: () => set({ open: false }),
}));
