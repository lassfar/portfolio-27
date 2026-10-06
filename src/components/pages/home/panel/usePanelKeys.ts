import { useEffect } from "react";
import { selectIsOpen, usePanelStore } from "#/stores/usePanelStore";
import { adjacentPlace, findPlace, wrapIndex } from "./content";

/**
 * The panel's keys (P27-80), one listener for the panel and the photo viewer, while it's
 * open: Esc goes back one step (the photo → the panel → the scene); ← → step through the
 * photos in the viewer, or the places in the full view. Keys with a modifier, and arrows
 * in a field or a video's controls, are left alone.
 */
export function usePanelKeys() {
  const open = usePanelStore(selectIsOpen);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      const s = usePanelStore.getState();
      if (e.key === "Escape") {
        e.preventDefault();
        s.back();
        return;
      }
      const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (dir === 0 || s.content?.kind !== "place") return;
      if (e.target instanceof Element && e.target.closest("input, textarea, select, [contenteditable], video")) return;
      if (s.photo !== null) {
        const count = findPlace(s.content.id)?.media.length ?? 0;
        if (count > 0) s.openPhoto(wrapIndex(s.photo + dir, count));
      } else if (s.view === "full") {
        s.open({ kind: "place", id: adjacentPlace(s.content.id, dir).id });
      } else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}
