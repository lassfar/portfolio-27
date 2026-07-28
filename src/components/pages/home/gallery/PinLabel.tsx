"use client";

import { useEffect, useState } from "react";
import { useGalleryStore } from "#/stores/useGalleryStore";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";

/**
 * A small luxurious label that follows the cursor while a globe pin is hovered,
 * naming the place. Driven by `hoverId`, which the 3D pins set on pointer-over.
 */
const PinLabel = () => {
  const hoverId = useGalleryStore((s) => s.hoverId);
  const loc = PHOTO_LOCATIONS.find((l) => l.id === hoverId) ?? null;
  const [pos, setPos] = useState({ x: -200, y: -200 });

  useEffect(() => {
    if (!loc) return;
    const onMove = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [loc]);

  if (!loc) return null;
  return (
    <div
      style={{ left: pos.x, top: pos.y }}
      className="pointer-events-none fixed z-[55] -translate-x-1/2 -translate-y-[170%] whitespace-nowrap rounded-full bg-rich-black/85 px-3.5 py-1.5 text-[11px] font-light tracking-wide text-light-peach ring-1 ring-white/10 backdrop-blur-md"
    >
      {loc.place}
    </div>
  );
};

export default PinLabel;
