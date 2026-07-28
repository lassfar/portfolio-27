import { create } from "zustand";

/**
 * Bridges the 3D Earth pins (which live inside the R3F canvas) to the DOM gallery
 * overlay. Clicking a pin calls `open(id)`; the side panel + lightbox read this
 * state. Kept in a store so the WebGL and DOM layers stay decoupled.
 */
type GalleryState = {
  /** The open place's id (side panel visible), or null (closed). */
  openId: string | null;
  /** The media index shown fullscreen in the lightbox, or null (lightbox closed). */
  lightboxIndex: number | null;
  /** Hovered pin id (for the label + glow) — set by the 3D pins. */
  hoverId: string | null;

  open: (id: string) => void;
  close: () => void;
  setHover: (id: string | null) => void;
  openLightbox: (index: number) => void;
  closeLightbox: () => void;
  setLightboxIndex: (index: number) => void;
};

export const useGalleryStore = create<GalleryState>((set) => ({
  openId: null,
  lightboxIndex: null,
  hoverId: null,

  open: (id) => set({ openId: id, lightboxIndex: null }),
  close: () => set({ openId: null, lightboxIndex: null }),
  setHover: (id) => set({ hoverId: id }),
  openLightbox: (index) => set({ lightboxIndex: index }),
  closeLightbox: () => set({ lightboxIndex: null }),
  setLightboxIndex: (index) => set({ lightboxIndex: index }),
}));
