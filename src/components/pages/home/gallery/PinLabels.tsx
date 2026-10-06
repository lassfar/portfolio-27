"use client";

import { useEffect, useRef } from "react";
import { Camera } from "lucide-react";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import { pinHover, pinLabels, pinScreen } from "#/components/three.js/earth/pinScreen";
import { selectKey, usePanelStore } from "#/stores/usePanelStore";
import { PHONE_QUERY, keepOnScreen } from "#/components/pages/home/labels/screenEdge";
import { type LabelBox, stackLabels } from "#/components/pages/home/labels/stack";
import { ANCHORED } from "#/components/pages/home/labels/anchored";
import SceneLabel from "#/components/pages/home/labels/SceneLabel";
import { placeLabelAria, placeLabelMeta } from "#/components/pages/home/panel/content";
import { PANEL_ID } from "#/components/pages/home/panel/config";

/** Gap (px) kept between labels that would otherwise overlap. */
const LABEL_GAP = 6;
/** Diagonal offset (px) of a label from its pin head. */
const OFFSET_X = 10;
const OFFSET_Y = 8;

/**
 * Always-on place labels beside each globe pin, shown once the Earth is in full view:
 * scene labels that say what they open ("London · 5 shots ↗", P27-80) and light their
 * pin on hover. The 3D pins publish their projected screen positions to `pinScreen`
 * once the camera has moved, then call our `update` in that same step (`pinLabels`), so
 * each label moves with its pin in the very frame it's drawn — positioned imperatively
 * (transform + opacity + tabIndex), so nothing re-renders per frame. Under the panel.
 *
 * Each label is anchored to one side of its pin (loc.labelAnchor) — used to fan
 * clustered places apart (London top-right, Brockenhurst top-left, ~130 km
 * apart, would otherwise sit on the same spot). A de-overlap pass then stacks
 * any that still collide. A label opens its place's panel, exactly like its 3D pin.
 */
const PinLabels = () => {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const openKey = usePanelStore(selectKey);
  const opened = usePanelStore((s) => s.opened);

  useEffect(() => {
    // Each label's last shown state — its opacity / pointer-events / tabIndex are only
    // written when it changes (the positions are still written every frame while shown).
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
      el.tabIndex = shown ? 0 : -1;
      if (!shown && document.activeElement === el) el.blur();
    };
    const boxes: (LabelBox & { el: HTMLButtonElement })[] = [];
    const update = () => {
      // 1. READ pass: gather the visible labels with their measured geometry.
      //    `left`/`top` are the label's desired top-left (beside the pin head).
      //    Reads are batched before any writes to avoid layout thrash.
      boxes.length = 0;
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

  return PHOTO_LOCATIONS.map((loc) => {
    const light = () => {
      pinHover.id = loc.id;
    };
    const unlight = () => {
      if (pinHover.id === loc.id) pinHover.id = null;
    };
    return (
      <SceneLabel
        key={loc.id}
        ref={(el) => {
          refs.current[loc.id] = el;
        }}
        labelKey={loc.id}
        icon={Camera}
        name={loc.place}
        meta={placeLabelMeta(loc)}
        fresh={!opened}
        aria-label={placeLabelAria(loc)}
        aria-expanded={openKey === loc.id}
        aria-controls={PANEL_ID}
        tabIndex={-1} // hidden until shown: `update` owns it from here (React never rewrites a constant prop)
        className={ANCHORED}
        onClick={() => usePanelStore.getState().open({ kind: "place", id: loc.id })}
        onPointerEnter={light}
        onFocus={light}
        onPointerLeave={unlight}
        onBlur={unlight}
      />
    );
  });
};

export default PinLabels;
