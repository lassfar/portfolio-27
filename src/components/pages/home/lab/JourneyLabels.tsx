"use client";

import { useEffect, useId, useRef, type MouseEvent } from "react";
import clsx from "clsx";
import { journeyLabels, journeyScreen } from "#/components/three.js/parker/journeyScreen";
import { PHONE_QUERY, keepOnScreen } from "#/components/pages/home/labels/screenEdge";
import { type LabelBox, stackLabels } from "#/components/pages/home/labels/stack";
import { ANCHORED, showAnchored } from "#/components/pages/home/labels/anchored";
import QuietLabel from "#/components/UI/labels/QuietLabel";
import { journeyLabelId } from "#/components/pages/home/labels/labelIds";

/** Gap (px) kept between labels that would otherwise overlap. */
const LABEL_GAP = 4;
/** How far above its dot a label sits (px, to its bottom edge). */
const OFFSET_Y = 7;
/** The markers: the launch, then the 7 Venus flybys. */
const COUNT = journeyScreen.markers.length;

/**
 * A spot's label for the markers reached there (bits of `here`): short, and on hover
 * how close its loops reach the Sun — each Venus flyby nudging them a little closer.
 */
function texts(here: number): { short: string; long: string } {
  const reach = journeyScreen.reach;
  if (here & 1) {
    return {
      short: "Launch",
      long: reach[0] ? `Launch · ${reach[0]} million km from the Sun` : "Launch",
    };
  }
  const flybys: number[] = [];
  for (let n = 1; n < COUNT; n++) if (here & (1 << n)) flybys.push(n);
  const last = flybys[flybys.length - 1];
  const name = flybys.length > 1 ? `Venus flybys ${flybys.join(" & ")}` : `Venus flyby ${last}`;
  return {
    short: `Venus ${flybys.join(" · ")}`,
    long: reach[last] ? `${name} · loops now reach ${reach[last]} million km` : name,
  };
}

/**
 * Opens or closes a label's full text (`data-open`), saying so to screen readers. Closed, the
 * full text is its description (read after its name); open, it's its name.
 */
function setOpen(label: HTMLElement, open: boolean) {
  if (open) label.dataset.open = "";
  else delete label.dataset.open;
  label.setAttribute("aria-expanded", String(open));
  const long = label.querySelector(".journey-label__long");
  if (open) label.removeAttribute("aria-describedby");
  else if (long?.id) label.setAttribute("aria-describedby", long.id);
}

/**
 * The labels on Parker's journey line (P27-72): "Launch" on the Earth's orbit and
 * "Venus n" at the flybys, each appearing as the line passes it — a spot it passes
 * again names both ("Venus 1 · 2"), how close its loops reach on hover — and how close
 * its tip has come to the Sun yet, riding it. The 3D line publishes
 * the markers' projected screen positions to `journeyScreen` once the camera has moved,
 * then calls our `update` in that same step (`journeyLabels`), so each label moves with
 * its dot in the very frame it's drawn — positioned imperatively (transform + opacity),
 * so nothing re-renders per frame; labels that would overlap are stacked (as the
 * Earth's pins do). Quiet: they open nothing (no glass, smaller). Under the panel.
 *
 * Each is a small disclosure button (P27-99, WCAG 2.1.1): in the Tab order only while
 * shown, and a press (Enter, a tap, a click) opens its full text, as a hover does.
 */
const JourneyLabels = () => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const shortRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const longRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const tipRef = useRef<HTMLSpanElement>(null);
  const id = useId();

  useEffect(() => {
    // Each label's last shown state and text — only written when they change.
    const shownBefore: boolean[] = [];
    const hereBefore: number[] = [];
    const openBefore: boolean[] = [];
    // Each label's size, measured when its text changes (not every frame: that forces a layout).
    const sizes: ({ w: number; h: number } | undefined)[] = [];
    // The tip's label: the same, for its text.
    let tipShown = false;
    let tipText = "";
    let tipSize: { w: number; h: number } | undefined;
    const remeasure = () => {
      sizes.fill(undefined);
      tipSize = undefined;
    };
    window.addEventListener("resize", remeasure);
    void document.fonts?.ready.then(remeasure);
    const boxes: (LabelBox & { el: HTMLElement })[] = [];
    // Phones keep each label on screen (P27-31); desktop places them as before.
    const phone = window.matchMedia(PHONE_QUERY);
    const leftOf = (x: number, w: number) =>
      phone.matches ? keepOnScreen(x - w / 2, w, x, window.innerWidth) : x - w / 2;
    const centreOf = (x: number, left: number, w: number) => (phone.matches ? left + w / 2 : x);

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
          showAnchored(el, s.shown);
          el.style.pointerEvents = s.shown ? "auto" : "none";
          el.tabIndex = s.shown ? 0 : -1;
          if (!s.shown) {
            setOpen(el, false); // a hidden label closes
            if (document.activeElement === el) el.blur();
          }
        }
        // Opened or closed by a press: its width changed.
        const open = el.dataset.open !== undefined;
        if (openBefore[i] !== open) {
          openBefore[i] = open;
          sizes[i] = undefined;
        }
        if (!s.shown) return;
        const { w, h } = (sizes[i] ??= { w: el.offsetWidth, h: el.offsetHeight });
        const left = leftOf(s.x, w);
        boxes.push({ el, cx: centreOf(s.x, left, w), left, top: s.y - h - OFFSET_Y, w, h });
      });
      const tip = journeyScreen.tip;
      const tipEl = tipRef.current;
      if (tipEl) {
        if (tip.text !== tipText) {
          // Its digits are tabular: it only needs measuring again when its length changes.
          if (tip.text.length !== tipText.length) tipSize = undefined;
          tipText = tip.text;
          tipEl.textContent = tip.text;
        }
        if (tip.shown !== tipShown) {
          tipShown = tip.shown;
          showAnchored(tipEl, tip.shown);
        }
        if (tip.shown) {
          const { w, h } = (tipSize ??= { w: tipEl.offsetWidth, h: tipEl.offsetHeight });
          // Kept in place (it moves every frame): the others make way for it.
          const left = leftOf(tip.x, w);
          boxes.push({
            el: tipEl,
            cx: centreOf(tip.x, left, w),
            left,
            top: tip.y - h - OFFSET_Y,
            w,
            h,
            pinned: true,
          });
        }
      }

      // 2. De-overlap: keep the tip's and then the lowest labels in place, lift any that
      //    collide above them.
      stackLabels(boxes, LABEL_GAP);

      // 3. Write.
      for (const b of boxes) b.el.style.transform = `translate(${b.left}px, ${b.top}px)`;
    };
    journeyLabels.update = update;
    return () => {
      window.removeEventListener("resize", remeasure);
      if (journeyLabels.update === update) journeyLabels.update = null;
    };
  }, []);

  // A press opens a label's full text (one at a time), and closes it again: the keyboard's
  // way, and touch screens' (no hover). A hover shows it too.
  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const label = e.currentTarget;
    const opening = label.dataset.open === undefined;
    for (const other of refs.current) if (other) setOpen(other, false);
    if (opening) setOpen(label, true);
  };

  return (
    <>
      {Array.from({ length: COUNT }, (_, i) => {
        const t = texts(1 << i);
        return (
          <button
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={journeyLabelId(i)} // read with the Lab's words (ChapterTexts)
            type="button"
            tabIndex={-1} // hidden until shown: `update` owns it from here
            aria-expanded={false} // `setOpen` owns these from here
            aria-describedby={`${id}-${i}`}
            onClick={toggle}
            className={clsx(
              "journey-label group rounded-full focus-ring transition-opacity duration-300",
              ANCHORED,
            )}
          >
            <QuietLabel className="block group-hover:text-peach">
              <span
                ref={(el) => {
                  shortRefs.current[i] = el;
                }}
                className="journey-label__short group-hover:hidden"
              >
                {t.short}
              </span>
              <span
                id={`${id}-${i}`}
                ref={(el) => {
                  longRefs.current[i] = el;
                }}
                className="journey-label__long hidden group-hover:inline"
              >
                {t.long}
              </span>
            </QuietLabel>
          </button>
        );
      })}
      <QuietLabel
        ref={tipRef}
        aria-hidden="true"
        tone="peach"
        className={clsx("tabular-nums", ANCHORED)}
      />
    </>
  );
};

export default JourneyLabels;
