import { useEffect, useRef, type RefObject } from "react";
import { inertOutside } from "#/components/hooks/a11y/inertOutside";
import { selectIsOpen, selectKey, usePanelStore } from "#/stores/usePanelStore";

const focus = (el: Element | null | undefined) => {
  if (el instanceof HTMLElement) el.focus({ preventScroll: true });
};

/**
 * The panel and the photo viewer as dialogs (P27-80). What's on top is modal — the photo
 * viewer, or the panel in its full view (the side panel leaves the scene usable), or in both
 * views when `alwaysModal` (the calm book: else focus could reach what the side panel
 * covers, WCAG 2.4.11): the rest of the page is inert, so focus and clicks stay inside.
 * Whatever is closed is inert.
 *
 * Focus moves into what opens (its `data-autofocus` control) and comes back where it was
 * opened from: a photo → its card (`data-photo`), the panel → its scene label
 * (`data-scene-label`, by its key: a 3D pin or a click without focus opened it too),
 * if that's still shown.
 */
export function usePanelModal(
  panelRef: RefObject<HTMLElement | null>,
  viewerRef: RefObject<HTMLElement | null>,
  /** Whether they're in the page yet (portalled after mounting). */
  mounted: boolean,
  /** The panel is modal in its side view too (the calm book, P27-93). */
  alwaysModal = false,
) {
  const open = usePanelStore(selectIsOpen);
  const view = usePanelStore((s) => s.view);
  const photo = usePanelStore((s) => s.photo);
  const key = usePanelStore(selectKey);
  const before = useRef<{ open: boolean; photo: number | null; key: string | null }>({
    open: false,
    photo: null,
    key: null,
  });

  useEffect(() => {
    const panel = panelRef.current;
    const viewer = viewerRef.current;
    if (!panel || !viewer) return;
    panel.inert = !open;
    viewer.inert = photo === null;
    const modal = photo !== null ? viewer : open && (alwaysModal || view === "full") ? panel : null;
    // The panel's scrim (the calm book's) stays: a tap on it closes the panel (P27-95).
    const undo = modal
      ? inertOutside(modal, (el) => modal === panel && el.hasAttribute("data-panel-scrim"))
      : undefined;

    const was = before.current;
    before.current = { open, photo, key };
    if (photo !== null && was.photo === null) focus(viewer.querySelector("[data-autofocus]"));
    else if (open && photo === null && was.photo !== null)
      focus(panel.querySelector(`[data-photo="${was.photo}"]`));
    else if (open && !was.open) focus(panel.querySelector("[data-autofocus]"));
    else if (!open && was.open && was.key) {
      const label = document.querySelector<HTMLElement>(`[data-scene-label="${was.key}"]`);
      if (label && label.tabIndex >= 0) focus(label);
    }
    return undo;
  }, [open, view, photo, key, panelRef, viewerRef, mounted, alwaysModal]);
}
