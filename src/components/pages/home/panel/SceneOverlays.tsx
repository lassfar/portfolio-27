"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import SceneLabelLayer from "#/components/pages/home/labels/SceneLabelLayer";
import PinLabels from "#/components/pages/home/gallery/PinLabels";
import Lightbox from "#/components/pages/home/gallery/Lightbox";
import JourneyLabels from "#/components/pages/home/lab/JourneyLabels";
import RecordLabel from "#/components/pages/home/lab/RecordLabel";
import ScenePanel from "./ScenePanel";
import { usePanelKeys } from "./usePanelKeys";
import { usePanelModal } from "./usePanelModal";

/**
 * The scene's DOM overlays (P27-80; were EarthGallery + LabExperiments), kept out of the
 * WebGL canvas so text and media stay crisp. From the bottom up:
 *   z-45  the scene labels — the Earth's places, Parker's journey and memory card;
 *   z-48  the full view's vignette (darker edges, so its text reads over the veiled scene);
 *   z-50  the panel (ScenePanel);
 *   z-60  the photo viewer — beside the panel, not in it: the side panel moves with
 *         `translate`, which would re-base the viewer's `position: fixed`.
 * (The story's title, subtitles and timeline sit at z-30…40.)
 *
 * The panel and the viewer are dialogs: focus moves in and back (usePanelModal), and
 * one listener owns their keys (usePanelKeys).
 *
 * Rendered through a PORTAL to `document.body`: the app tree lives inside
 * ScrollSmoother's `#smooth-content`, which is `transform`ed, and a transformed ancestor
 * re-bases `position: fixed`.
 */
const SceneOverlays = () => {
  const [mounted, setMounted] = useState(false);
  const panel = useRef<HTMLElement>(null);
  const viewer = useRef<HTMLDivElement>(null);
  useEffect(() => setMounted(true), []);
  usePanelModal(panel, viewer, mounted);
  usePanelKeys();
  if (!mounted) return null;

  return createPortal(
    <>
      <SceneLabelLayer>
        <PinLabels />
        <JourneyLabels />
        <RecordLabel />
      </SceneLabelLayer>
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

export default SceneOverlays;
