"use client";

import { useEffect, useRef } from "react";
import { MemoryStick } from "lucide-react";
import { recordLabel, recordScreen, type RecordScreen } from "#/components/three.js/voyager/recordScreen";
import { usePanelStore } from "#/stores/usePanelStore";
import { PHONE_QUERY, keepOnScreen } from "#/components/pages/home/labels/screenEdge";
import { ANCHORED, showAnchored } from "#/components/pages/home/labels/anchored";
import QuietLabel from "#/components/UI/labels/QuietLabel";
import SceneLabel from "#/components/pages/home/labels/SceneLabel";
import { PANEL_ID } from "#/components/pages/home/panel/config";

/**
 * The Lab's labels (the `recordScreen` / `recordLabel` names date from the Voyager's
 * Golden Record): from afar, the Parker Solar Probe's name on its marker (quiet: it opens
 * nothing); once you're there, a scene label above the probe's memory card that opens
 * the Lab (P27-80). The 3D craft publishes the card's projected screen position to
 * `recordScreen` once the camera has moved, then calls our `update` in that same step
 * (`recordLabel`), so the shown label moves with the card in the very frame it's drawn —
 * positioned imperatively (transform + opacity + tabIndex), so nothing re-renders per
 * frame. Under the panel.
 */
const RecordLabel = () => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const expanded = usePanelStore((s) => s.content?.kind === "lab");
  const opened = usePanelStore((s) => s.opened);

  useEffect(() => {
    // Opacity / pointer-events / tabIndex only change with these (null: none applied yet).
    let shownBefore: boolean | null = null;
    let textBefore: RecordScreen["text"] | null = null;
    // Phones keep the label on screen (P27-31), so they need its width: measured once
    // (and after a resize or the fonts load). Desktop centres it on its point.
    const phone = window.matchMedia(PHONE_QUERY);
    const widths = new Map<HTMLElement, number>();
    const widthOf = (el: HTMLElement) => {
      let w = widths.get(el);
      if (w === undefined) widths.set(el, (w = el.offsetWidth));
      return w;
    };
    const remeasure = () => widths.clear();
    window.addEventListener("resize", remeasure);
    void document.fonts?.ready.then(remeasure);
    const update = () => {
      const card = cardRef.current;
      const probe = probeRef.current;
      if (!card || !probe) return;
      const s = recordScreen;
      const isCard = s.text === "card";
      if (s.shown) {
        const el = isCard ? card : probe;
        if (phone.matches) {
          const w = widthOf(el);
          el.style.transform = `translate(${keepOnScreen(s.x - w / 2, w, s.x, window.innerWidth)}px, calc(${s.y}px - 220%))`;
        } else {
          el.style.transform = `translate(calc(${s.x}px - 50%), calc(${s.y}px - 220%))`;
        }
      }
      if (s.shown === shownBefore && s.text === textBefore) return;
      shownBefore = s.shown;
      textBefore = s.text;
      const cardShown = s.shown && isCard;
      showAnchored(card, cardShown);
      card.style.pointerEvents = cardShown ? "auto" : "none";
      card.tabIndex = cardShown ? 0 : -1;
      if (!cardShown && document.activeElement === card) card.blur();
      showAnchored(probe, s.shown && !isCard);
    };
    recordLabel.update = update;
    return () => {
      window.removeEventListener("resize", remeasure);
      if (recordLabel.update === update) recordLabel.update = null;
    };
  }, []);

  return (
    <>
      <SceneLabel
        ref={cardRef}
        labelKey="lab"
        icon={MemoryStick}
        name="Memory card"
        meta="open the Lab"
        tone="card"
        fresh={!opened}
        aria-label="Open Parker's memory card: the Lab experiments"
        aria-expanded={expanded}
        aria-controls={PANEL_ID}
        tabIndex={-1} // hidden until shown: `update` owns it from here
        className={ANCHORED}
        onClick={() => usePanelStore.getState().open({ kind: "lab" })}
      />
      <QuietLabel ref={probeRef} aria-hidden="true" className={ANCHORED}>
        Parker Solar Probe
      </QuietLabel>
    </>
  );
};

export default RecordLabel;
