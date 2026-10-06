"use client";

import { useEffect, useRef } from "react";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import { pinLabels, pinScreen } from "#/components/three.js/earth/pinScreen";
import { usePanelStore } from "#/stores/usePanelStore";
import { PHONE_QUERY, keepOnScreen } from "#/components/pages/home/labels/screenEdge";
import { type LabelBox, stackLabels } from "#/components/pages/home/labels/stack";

/** Gap (px) kept between labels that would otherwise overlap. */
const LABEL_GAP = 6;
/** Diagonal offset (px) of a label from its pin head. */
const OFFSET_X = 10;
const OFFSET_Y = 8;

/**
 * Always-on place labels anchored above each globe pin, shown once the Earth is
 * in full view. The 3D pins publish their projected screen positions to
 * `pinScreen` once the camera has moved, then call our `update` in that same step
 * (`pinLabels`), so each label moves with its pin in the very frame it's drawn —
 * positioned imperatively (transform + opacity), so nothing re-renders per frame.
 * They sit under the side panels (z-45 < the panels' z-50).
 *
 * Each label is anchored to one side of its pin (loc.labelAnchor) — used to fan
 * clustered places apart (London top-right, Brockenhurst top-left, ~130 km
 * apart, would otherwise sit on the same spot). A de-overlap pass then stacks
 * any that still collide. Labels are clickable and open that place's gallery,
 * exactly like clicking the 3D pin.
 */
const PinLabels = () => {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    // Each label's last shown state — its opacity / pointer-events are only written
    // when it changes (the positions are still written every frame while shown).
    const shownBefore: Record<string, boolean> = {};
    // Each label's size, measured once (P27-78): the text never changes, and reading
    // it every frame forced a layout. Measured again after a resize or the fonts load.
    const sizes: Record<string, { w: number; h: number }> = {};
    const sizeOf = (id: string, el: HTMLButtonElement) =>
      (sizes[id] ??= { w: el.offsetWidth, h: el.offsetHeight });
    const remeasure = () => {
      for (const id of Object.keys(sizes)) delete sizes[id];
    };
    window.addEventListener("resize", remeasure);
    void document.fonts?.ready.then(remeasure);
    const phone = window.matchMedia(PHONE_QUERY); // phones keep each label on screen (P27-31)
    const setShown = (id: string, el: HTMLButtonElement, shown: boolean) => {
      if (shownBefore[id] === shown) return;
      shownBefore[id] = shown;
      el.style.opacity = shown ? "1" : "0";
      el.style.pointerEvents = shown ? "auto" : "none";
    };
    const update = () => {
      // 1. READ pass: gather the visible labels with their measured geometry.
      //    `left`/`top` are the label's desired top-left (centered on the pin,
      //    sitting above the head). Reads are batched before any writes to
      //    avoid layout thrash.
      const boxes: (LabelBox & { el: HTMLButtonElement })[] = [];
      for (const loc of PHOTO_LOCATIONS) {
        const el = refs.current[loc.id];
        if (!el) continue;
        const s = pinScreen[loc.id];
        if (s && s.shown) {
          const { w, h } = sizeOf(loc.id, el);
          // Anchor to the requested side of the pin head so clustered labels
          // fan out rather than stack on the same point.
          const anchored =
            (loc.labelAnchor ?? "top-left") === "top-right"
              ? s.x + OFFSET_X
              : s.x - w - OFFSET_X;
          const left = phone.matches ? keepOnScreen(anchored, w, s.x, window.innerWidth) : anchored;
          const top = s.y - h - OFFSET_Y;
          boxes.push({ el, cx: left + w / 2, left, top, w, h });
          setShown(loc.id, el, true);
        } else {
          setShown(loc.id, el, false);
        }
      }

      // 2. DE-OVERLAP: keep the lowest label anchored and lift any that collide above
      //    it, so labels stack cleanly.
      stackLabels(boxes, LABEL_GAP);

      // 3. WRITE pass: apply the resolved positions.
      for (const b of boxes) {
        b.el.style.transform = `translate(${b.left}px, ${b.top}px)`;
      }
    };
    pinLabels.update = update;
    return () => {
      window.removeEventListener("resize", remeasure);
      if (pinLabels.update === update) pinLabels.update = null;
    };
  }, []);

  return (
    <>
      {PHOTO_LOCATIONS.map((loc) => (
        <button
          key={loc.id}
          type="button"
          ref={(el) => {
            refs.current[loc.id] = el;
          }}
          onClick={() => usePanelStore.getState().open({ kind: "place", id: loc.id })}
          aria-label={`Open ${loc.place} gallery`}
          className="tap-target pointer-events-none fixed left-0 top-0 z-[45] cursor-pointer whitespace-nowrap rounded-full bg-rich-black/85 px-3 py-1.5 text-[11px] font-light tracking-wide text-light-peach opacity-0 ring-1 ring-white/10 backdrop-blur-md transition-[opacity,color,box-shadow] duration-300 hover:text-peach hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/60"
          style={{ willChange: "transform, opacity" }}
        >
          {loc.place}
        </button>
      ))}
    </>
  );
};

export default PinLabels;
