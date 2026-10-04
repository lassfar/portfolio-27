"use client";

import { useEffect, useRef } from "react";
import { PARKER_JOURNEY } from "#/components/three.js/parker/config";
import { journeyLabels, journeyScreen } from "#/components/three.js/parker/journeyScreen";

/** Gap (px) kept between labels that would otherwise overlap. */
const LABEL_GAP = 4;
/** How far above its dot a label sits (px, to its bottom edge). */
const OFFSET_Y = 7;
/** The markers: the launch, then the 7 Venus flybys. */
const COUNT = 1 + PARKER_JOURNEY.flybys.length;

/** A spot's label for the markers reached there (bits of `here`): short, and on hover. */
function texts(here: number): { short: string; long: string } {
  if (here & 1) return { short: "Launch", long: "Launch · Aug 2018" };
  const flybys: number[] = [];
  for (let n = 1; n < COUNT; n++) if (here & (1 << n)) flybys.push(n);
  const dates = flybys.map((n) => PARKER_JOURNEY.flybys[n - 1]).join(", ");
  return flybys.length > 1
    ? { short: `Venus ${flybys.join(" · ")}`, long: `Venus flybys ${flybys.join(" & ")} · ${dates}` }
    : { short: `Venus ${flybys[0]}`, long: `Venus flyby ${flybys[0]} · ${dates}` };
}

/**
 * The labels on Parker's journey line (P27-72): "Launch" on the Earth's orbit and
 * "Venus n" at the flybys, each appearing as the line reaches it — a spot it passes
 * again names both ("Venus 1 · 2"), and the dates show on hover. The 3D line publishes
 * the markers' projected screen positions to `journeyScreen` once the camera has moved,
 * then calls our `update` in that same step (`journeyLabels`), so each label moves with
 * its dot in the very frame it's drawn — positioned imperatively (transform + opacity),
 * so nothing re-renders per frame; labels that would overlap are stacked (as the
 * Earth's pins do). Quieter than the pin labels (no blur, smaller), under the side
 * panels (z-45 < the panels' z-50).
 */
const JourneyLabels = () => {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  const shortRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const longRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    // Each label's last shown state and text — only written when they change.
    const shownBefore: boolean[] = [];
    const hereBefore: number[] = [];
    // Each label's size, measured when its text changes (not every frame: that forces a layout).
    const sizes: ({ w: number; h: number } | undefined)[] = [];
    const remeasure = () => sizes.fill(undefined);
    window.addEventListener("resize", remeasure);
    void document.fonts?.ready.then(remeasure);
    const boxes: { el: HTMLSpanElement; cx: number; left: number; top: number; w: number; h: number }[] = [];

    const update = () => {
      // 1. Read: the shown labels' desired boxes (centred above their dots).
      boxes.length = 0;
      journeyScreen.markers.forEach((s, i) => {
        const el = refs.current[i];
        if (!el) return;
        if (s.shown && hereBefore[i] !== s.here) {
          hereBefore[i] = s.here;
          const t = texts(s.here);
          if (shortRefs.current[i]) shortRefs.current[i].textContent = t.short;
          if (longRefs.current[i]) longRefs.current[i].textContent = t.long;
          sizes[i] = undefined;
        }
        if (shownBefore[i] !== s.shown) {
          shownBefore[i] = s.shown;
          el.style.opacity = s.shown ? "1" : "0";
          el.style.pointerEvents = s.shown ? "auto" : "none";
        }
        if (!s.shown) return;
        const { w, h } = (sizes[i] ??= { w: el.offsetWidth, h: el.offsetHeight });
        boxes.push({ el, cx: s.x, left: s.x - w / 2, top: s.y - h - OFFSET_Y, w, h });
      });

      // 2. De-overlap: keep the lowest label in place, lift any that collide above it.
      boxes.sort((a, b) => b.top - a.top);
      for (let i = 1; i < boxes.length; i++) {
        const cur = boxes[i];
        for (let j = 0; j < i; j++) {
          const o = boxes[j];
          const hOver = Math.abs(cur.cx - o.cx) < (cur.w + o.w) / 2 + LABEL_GAP;
          const vOver = cur.top < o.top + o.h + LABEL_GAP && cur.top + cur.h + LABEL_GAP > o.top;
          if (hOver && vOver) cur.top = o.top - cur.h - LABEL_GAP;
        }
      }

      // 3. Write.
      for (const b of boxes) b.el.style.transform = `translate(${b.left}px, ${b.top}px)`;
    };
    journeyLabels.update = update;
    return () => {
      window.removeEventListener("resize", remeasure);
      if (journeyLabels.update === update) journeyLabels.update = null;
    };
  }, []);

  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => {
        const t = texts(1 << i);
        return (
          <span
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            aria-hidden="true"
            className="group pointer-events-none fixed left-0 top-0 z-[45] whitespace-nowrap rounded-full bg-rich-black/70 px-2 py-0.5 text-[10px] font-light tracking-wide text-light-peach/80 opacity-0 ring-1 ring-white/10 transition-[opacity,color] duration-300 hover:text-peach"
            style={{ willChange: "transform, opacity" }}
          >
            <span
              ref={(el) => {
                shortRefs.current[i] = el;
              }}
              className="group-hover:hidden"
            >
              {t.short}
            </span>
            <span
              ref={(el) => {
                longRefs.current[i] = el;
              }}
              className="hidden group-hover:inline"
            >
              {t.long}
            </span>
          </span>
        );
      })}
    </>
  );
};

export default JourneyLabels;
