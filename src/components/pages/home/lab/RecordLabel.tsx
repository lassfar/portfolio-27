"use client";

import { useEffect, useRef } from "react";
import { recordScreen } from "#/components/three.js/voyager/recordScreen";
import { useLabStore } from "#/stores/useLabStore";

/**
 * The always-on label anchored above Voyager's Golden Record, shown once the Lab
 * is in full view. The 3D craft publishes the record's projected screen position
 * to `recordScreen`; here we read it on our own rAF loop and position the label
 * imperatively (transform + opacity), so nothing re-renders per frame. Clicking
 * it opens the experiments panel — the same seam the Earth pins use to open the
 * gallery.
 */
const RecordLabel = () => {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let raf = 0;
    let shownBefore: boolean | null = null; // opacity / pointer-events only change with it
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const el = ref.current;
      if (!el) return;
      const s = recordScreen;
      if (s.shown) el.style.transform = `translate(calc(${s.x}px - 50%), calc(${s.y}px - 220%))`;
      if (s.shown === shownBefore) return;
      shownBefore = s.shown;
      el.style.opacity = s.shown ? "1" : "0";
      el.style.pointerEvents = s.shown ? "auto" : "none";
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => useLabStore.getState().openPanel()}
      aria-label="Open the Golden Record — the Lab experiments"
      className="pointer-events-none fixed left-0 top-0 z-[55] cursor-pointer whitespace-nowrap rounded-full bg-rich-black/85 px-3 py-1.5 text-[11px] font-light tracking-wide text-light-peach opacity-0 ring-1 ring-white/10 backdrop-blur-md transition-[opacity,color,box-shadow] duration-300 hover:text-peach hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/60"
      style={{ willChange: "transform, opacity" }}
    >
      ◉ Golden Record — open the Lab
    </button>
  );
};

export default RecordLabel;
