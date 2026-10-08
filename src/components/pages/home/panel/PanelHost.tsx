"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Lightbox from "#/components/pages/home/gallery/Lightbox";
import ScenePanel from "./ScenePanel";
import { usePanelKeys } from "./usePanelKeys";
import { usePanelModal } from "./usePanelModal";

/**
 * The panel and the photo viewer (P27-80), for the journey (SceneOverlays) and the calm
 * book (P27-93) alike. From the bottom up:
 *   `children`  what opens them, if it lives here (the journey's scene labels, z-45);
 *   z-48  the full view's vignette (darker edges, so its text reads over the page);
 *   z-50  the panel (ScenePanel);
 *   z-60  the photo viewer — beside the panel, not in it: the side panel moves with
 *         `translate`, which would re-base the viewer's `position: fixed`.
 *
 * The panel and the viewer are dialogs: focus moves in and back (usePanelModal), and
 * one listener owns their keys (usePanelKeys).
 *
 * Rendered through a PORTAL to `document.body`: the journey lives inside ScrollSmoother's
 * `#smooth-content`, which is `transform`ed, and a transformed ancestor re-bases
 * `position: fixed`.
 */
const PanelHost = ({ children }: { children?: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  usePanelModal(panel, viewer, mounted);
  usePanelKeys();
  if (!mounted) return null;

  return createPortal(
    <>
      {children}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-48 bg-radial-[120%_90%_at_50%_40%] from-transparent from-25% to-black/80 opacity-0 transition-opacity duration-700 ease-out-quint panel-full:opacity-100"
      />
      <ScenePanel ref={panel} />
      <Lightbox ref={viewer} />
    </>,
    document.body,
  );
};

export default PanelHost;
