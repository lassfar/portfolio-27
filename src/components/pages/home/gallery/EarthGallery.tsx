"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import GalleryPanel from "./GalleryPanel";
import Lightbox from "./Lightbox";
import PinLabel from "./PinLabel";

/**
 * Mounts the DOM gallery overlays (hover label + side panel + lightbox) that the
 * Earth pins open. Kept out of the WebGL canvas so the media stays crisp.
 *
 * Rendered through a PORTAL to `document.body` — the app tree lives inside
 * ScrollSmoother's `#smooth-content`, which is `transform`ed, and a transformed
 * ancestor re-bases `position: fixed`. Portalling to the body escapes that so the
 * overlays are pinned to the real viewport. Driven by `useGalleryStore`, which
 * the 3D pins write to on hover/click (M3).
 */
const EarthGallery = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
    <>
      <PinLabel />
      <GalleryPanel />
      <Lightbox />
    </>,
    document.body
  );
};

export default EarthGallery;
