import { create } from "zustand";

/** How the panel shows: over the whole screen, the scene veiled behind (the default), or at the side. */
export type PanelView = "full" | "side";

/** What it shows: one of the Earth's places (its photos), or the Lab (Parker's memory card). */
export type PanelContent = { kind: "place"; id: string } | { kind: "lab" };

/** A content's key: the place's id, or "lab" (the scene label that opens it carries it). */
export const panelKey = (content: PanelContent): string =>
  content.kind === "place" ? content.id : "lab";

type PanelState = {
  /** What's open, or null (closed). */
  content: PanelContent | null;
  /** Its view — kept for the rest of the visit once changed. */
  view: PanelView;
  /** The photo shown in the photo viewer (its index in the place's media), or null. */
  photo: number | null;
  /** Whether a panel has been opened this visit: the scene labels stop breathing. */
  opened: boolean;

  /** Opens it on `content` (or switches to it); the photo viewer closes. */
  open: (content: PanelContent) => void;
  toggleView: () => void;
  openPhoto: (index: number | null) => void;
  /** One step back: the photo viewer → the panel → the scene. */
  back: () => void;
  close: () => void;
};

/**
 * The scene's panel (P27-80; was useGalleryStore + useLabStore): the Earth's 3D pins and
 * the scene labels open it, the panel, the photo viewer, the scene (its veil and input
 * lock) and the story's overlays read it. Kept in a store so the WebGL and DOM layers
 * stay decoupled. Holds no data — the panel finds the place by its id.
 */
export const usePanelStore = create<PanelState>((set) => ({
  content: null,
  view: "full",
  photo: null,
  opened: false,

  open: (content) =>
    set((s) =>
      s.content && panelKey(s.content) === panelKey(content) && s.photo === null
        ? s
        : { content, photo: null, opened: true },
    ),
  toggleView: () => set((s) => ({ view: s.view === "full" ? "side" : "full" })),
  openPhoto: (photo) => set({ photo }),
  back: () => set((s) => (s.photo !== null ? { photo: null } : { content: null })),
  close: () => set({ content: null, photo: null }),
}));

/** Whether a panel is open. */
export const selectIsOpen = (s: PanelState) => s.content !== null;
/** The open panel's key (see panelKey), or null. */
export const selectKey = (s: PanelState) => (s.content ? panelKey(s.content) : null);
