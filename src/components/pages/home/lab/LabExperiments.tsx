"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import RecordLabel from "./RecordLabel";
import ExperimentsPanel from "./ExperimentsPanel";

/**
 * Mounts the DOM overlays for The Lab (the Parker Solar Probe) — the memory-card
 * label + the experiments side panel — that the craft's memory card opens.
 *
 * Rendered through a PORTAL to `document.body` for the same reason as the Earth
 * gallery: the app tree lives inside ScrollSmoother's `#smooth-content`, which is
 * `transform`ed, and a transformed ancestor re-bases `position: fixed`. Portalling
 * to the body escapes that so the overlays pin to the real viewport. Driven by
 * `useLabStore`, which the label opens on click (mirrors EarthGallery).
 */
const LabExperiments = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <>
      <RecordLabel />
      <ExperimentsPanel />
    </>,
    document.body
  );
};

export default LabExperiments;
