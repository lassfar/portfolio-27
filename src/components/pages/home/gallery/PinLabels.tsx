"use client";

import { useEffect, useRef } from "react";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import { pinScreen } from "#/components/three.js/earth/pinScreen";
import { useGalleryStore } from "#/stores/useGalleryStore";

/** Gap (px) kept between labels that would otherwise overlap. */
const LABEL_GAP = 6;
/** Diagonal offset (px) of a label from its pin head. */
const OFFSET_X = 10;
const OFFSET_Y = 8;

/**
 * Always-on place labels anchored above each globe pin, shown once the Earth is
 * in full view. The 3D pins publish their projected screen positions to
 * `pinScreen`; here we read those on our own rAF loop and position each label
 * imperatively (transform + opacity), so nothing re-renders per frame.
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
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);

      // 1. READ pass: gather the visible labels with their measured geometry.
      //    `left`/`top` are the label's desired top-left (centered on the pin,
      //    sitting above the head). Reads are batched before any writes to
      //    avoid layout thrash.
      const boxes: {
        el: HTMLButtonElement;
        cx: number;
        left: number;
        top: number;
        w: number;
        h: number;
      }[] = [];
      for (const loc of PHOTO_LOCATIONS) {
        const el = refs.current[loc.id];
        if (!el) continue;
        const s = pinScreen[loc.id];
        if (s && s.shown) {
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          // Anchor to the requested side of the pin head so clustered labels
          // fan out rather than stack on the same point.
          const left =
            (loc.labelAnchor ?? "top-left") === "top-right"
              ? s.x + OFFSET_X
              : s.x - w - OFFSET_X;
          const top = s.y - h - OFFSET_Y;
          boxes.push({ el, cx: left + w / 2, left, top, w, h });
          el.style.opacity = "1";
          el.style.pointerEvents = "auto";
        } else {
          el.style.opacity = "0";
          el.style.pointerEvents = "none";
        }
      }

      // 2. DE-OVERLAP: keep the lowest label anchored and push any that collide
      //    (horizontally + vertically) up above it, so labels stack cleanly.
      boxes.sort((a, b) => b.top - a.top); // bottom-most first
      for (let i = 1; i < boxes.length; i++) {
        const cur = boxes[i];
        let guard = 0;
        let moved = true;
        while (moved && guard++ < boxes.length) {
          moved = false;
          for (let j = 0; j < i; j++) {
            const o = boxes[j];
            const hOver = Math.abs(cur.cx - o.cx) < (cur.w + o.w) / 2 + LABEL_GAP;
            const vOver =
              cur.top < o.top + o.h + LABEL_GAP && cur.top + cur.h + LABEL_GAP > o.top;
            if (hOver && vOver) {
              cur.top = o.top - cur.h - LABEL_GAP;
              moved = true;
            }
          }
        }
      }

      // 3. WRITE pass: apply the resolved positions.
      for (const b of boxes) {
        b.el.style.transform = `translate(${b.left}px, ${b.top}px)`;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
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
          onClick={() => useGalleryStore.getState().open(loc.id)}
          aria-label={`Open ${loc.place} gallery`}
          className="pointer-events-none fixed left-0 top-0 z-[55] cursor-pointer whitespace-nowrap rounded-full bg-rich-black/85 px-3 py-1.5 text-[11px] font-light tracking-wide text-light-peach opacity-0 ring-1 ring-white/10 backdrop-blur-md transition-[opacity,color,box-shadow] duration-300 hover:text-peach hover:ring-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-peach/60"
          style={{ willChange: "transform, opacity" }}
        >
          {loc.place}
        </button>
      ))}
    </>
  );
};

export default PinLabels;
