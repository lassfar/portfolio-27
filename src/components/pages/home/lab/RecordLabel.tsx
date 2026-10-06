"use client";

import { useEffect, useRef } from "react";
import { recordLabel, recordScreen } from "#/components/three.js/voyager/recordScreen";
import { usePanelStore } from "#/stores/usePanelStore";
import { PHONE_QUERY, keepOnScreen } from "#/components/pages/home/labels/screenEdge";

/**
 * The Lab's label (the `recordScreen` / `recordLabel` names date from the Voyager's
 * Golden Record): from afar it names the Parker Solar Probe on its marker; once you're
 * there it sits above the probe's memory card and opens the Lab. The 3D craft publishes
 * the card's projected screen position to `recordScreen` once the camera has moved,
 * then calls our `update` in that same step (`recordLabel`), so the label moves with
 * the card in the very frame it's drawn — positioned imperatively (transform +
 * opacity), so nothing re-renders per frame. It sits under the side panels (z-45 < the
 * panels' z-50). Clicking it opens the experiments panel — the same seam the Earth pins
 * use to open the gallery.
 */
const RecordLabel = () => {
  const ref = useRef<HTMLButtonElement>(null);
  const cardText = useRef<HTMLSpanElement>(null);
  const probeText = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let before = ""; // opacity / pointer-events / text only change with it
    // Phones keep it on screen (P27-31), so they need its width: measured once per text
    // (and after a resize). Desktop centres it on its point, as before.
    const phone = window.matchMedia(PHONE_QUERY);
    let width: number | undefined;
    const remeasure = () => (width = undefined);
    window.addEventListener("resize", remeasure);
    const update = () => {
      const el = ref.current;
      if (!el) return;
      const s = recordScreen;
      if (s.shown) {
        if (phone.matches) {
          const w = (width ??= el.offsetWidth);
          el.style.transform = `translate(${keepOnScreen(s.x - w / 2, w, s.x, window.innerWidth)}px, calc(${s.y}px - 220%))`;
        } else {
          el.style.transform = `translate(calc(${s.x}px - 50%), calc(${s.y}px - 220%))`;
        }
      }
      const state = `${s.shown}:${s.text}`;
      if (state === before) return;
      before = state;
      width = undefined; // its text may change below: measure it again
      // From afar it names the probe (not clickable); once there, the memory card opens the Lab.
      const card = s.text === "card";
      el.style.opacity = s.shown ? "1" : "0";
      el.style.pointerEvents = s.shown && card ? "auto" : "none";
      el.tabIndex = card ? 0 : -1;
      el.setAttribute("aria-label", card ? "Open Parker's memory card — the Lab experiments" : "The Parker Solar Probe");
      if (cardText.current) cardText.current.hidden = !card;
      if (probeText.current) probeText.current.hidden = card;
    };
    recordLabel.update = update;
    return () => {
      window.removeEventListener("resize", remeasure);
      if (recordLabel.update === update) recordLabel.update = null;
    };
  }, []);

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => {
        if (recordScreen.text === "card") usePanelStore.getState().open({ kind: "lab" });
      }}
      aria-label="Open Parker's memory card — the Lab experiments"
      className="tap-target pointer-events-none fixed left-0 top-0 z-[45] cursor-pointer whitespace-nowrap rounded-full bg-rich-black/85 px-3 py-1.5 text-[11px] font-light tracking-wide text-light-peach opacity-0 ring-1 ring-white/10 backdrop-blur-md transition-[opacity,color,box-shadow] duration-300 hover:text-peach hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/60"
      style={{ willChange: "transform, opacity" }}
    >
      <span ref={cardText}>◉ Memory card — open the Lab</span>
      <span ref={probeText} hidden>
        Parker Solar Probe
      </span>
    </button>
  );
};

export default RecordLabel;
