"use client";

import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import gsap from "gsap";
import { ArrowDown } from "lucide-react";
import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import Button from "#/components/UI/buttons/Button";
import Tooltip from "#/components/UI/tooltip/Tooltip";
import { useIsClient } from "#/components/hooks/useIsClient";
import { useReducedMotion } from "#/components/hooks/useReducedMotion";
import { useTimeout } from "#/components/hooks/useTimeout";
import { stopGlideOnInput } from "#/components/pages/home/scroll/glide";
import { goTo } from "#/components/pages/home/scroll/goTo";
import { mpAt } from "#/components/three.js/star/config";
import { useGlide } from "#/stores/useGlide";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { PHASE_NAV, type PhaseStop } from "./config";
import { isAssistantVisible } from "./lift";
import { useAssistantStory } from "./useAssistantStory";
import { useGlideHide } from "./useGlideHide";
import { useReveal, type GrowBy } from "./useReveal";

gsap.registerPlugin(useGSAP);

/** An open button folds back once the story has really moved on (not on a ScrollTrigger refresh). */
const FOLD_ON_SCROLL = mpAt(2);

/**
 * The assistant itself (rendered once in the browser, motion allowed): the orb, the button
 * it grows into, and what moves them. One GSAP context (`useGSAP`) for all its animations.
 */
const NavAssistantView = () => {
  const root = useRef<HTMLDivElement>(null);
  const lift = useRef<HTMLDivElement>(null);
  const orb = useRef<HTMLButtonElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const reveal = useRef<HTMLDivElement>(null);

  const { next, past, panelOpen, gliding } = useAssistantStory();
  const [frozen, setFrozen] = useState<PhaseStop | null>(null); // the chapter offered while its button is out
  const stop = frozen ?? next;
  const visible = isAssistantVisible({ past, hasStop: stop !== null, panelOpen });

  const { contextSafe } = useGSAP({ scope: root });
  const onFolded = useRef(() => {}); // tells the glide's hide (set below)
  const [open, button] = useReveal({ orb, shell, reveal }, contextSafe, () => {
    setFrozen(null);
    onFolded.current();
  });
  const { phase, folded } = useGlideHide(
    { root, lift, orb, gliding, visible, reveal: button },
    contextSafe,
  );
  onFolded.current = folded;
  const shown = phase === "shown";
  const hover = useTimeout();

  const grow = (by: GrowBy) => {
    setFrozen(stop);
    button.grow(by);
  };

  // Desktop: the mouse opens it after a short intent pause (a pass-over doesn't), and leaving
  // the orb + button folds it back after a short grace (slipping off the edge doesn't). Touch
  // and keyboard keep the tap / Enter. Not while it's away for a glide.
  const onPointerEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !shown) return;
    hover.clear();
    if (button.isIdle()) hover.set(() => grow("hover"), PHASE_NAV.hoverOpenDelay);
  };
  const onPointerLeave = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !shown) return;
    hover.set(() => button.fold(), PHASE_NAV.hoverCloseDelay);
  };
  useEffect(() => {
    if (!shown) hover.clear();
  }, [hover, shown]);

  // A panel opening (the story freezes) folds it.
  useEffect(() => {
    if (panelOpen) button.fold();
  }, [button, panelOpen]);

  // While the button is open: Esc, a click elsewhere, or the story moving on folds it back.
  useEffect(() => {
    if (!open || !shown) return;
    const from = useJourneyScroll.getState().progress;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") button.fold(true);
    };
    const onPointerDown = (e: globalThis.PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) button.fold();
    };
    const unsubscribe = useJourneyScroll.subscribe(({ progress }) => {
      if (Math.abs(progress - from) > FOLD_ON_SCROLL) button.fold();
    });
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      unsubscribe();
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, { capture: true });
    };
  }, [button, open, shown]);

  // The button: glide to its chapter. The assistant then folds back into its dot, which shrinks
  // out of the way until the glide is over (useGlideHide); if no glide could start (a panel
  // holds the scroll), it just folds back.
  const go = () => {
    if (!stop || useGlide.getState().by !== null) return;
    hover.clear();
    goTo(stop.id, { ease: PHASE_NAV.ease, by: "assistant" });
    if (useGlide.getState().by !== "assistant") button.fold();
  };

  return (
    <div
      ref={root}
      className={clsx(
        "nav-assistant",
        visible && "is-visible",
        open && "is-open",
        !shown && "is-gliding",
      )}
      style={{ "--na-orb": `${PHASE_NAV.orbSize}px` } as CSSProperties}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <div ref={lift} className="nav-assistant__lift" inert={!shown}>
        <button
          ref={orb}
          type="button"
          className="nav-assistant__orb group/tip"
          aria-label={stop ? `Next chapter: ${stop.name}` : "Next chapter"}
          aria-expanded={open}
          tabIndex={visible && !open ? 0 : -1}
          onClick={() => grow("tap")}
        >
          <span className="nav-assistant__glow" />
          {/* After a short hover, until the button grows out of the orb. */}
          <Tooltip side="above" delayed open={open ? false : undefined}>
            Next chapter
          </Tooltip>
        </button>
        <div ref={shell} className="nav-assistant__shell" aria-hidden="true" />
        <div ref={reveal} className="nav-assistant__reveal" inert={!open}>
          <Button
            label={stop?.name ?? ""}
            icon={ArrowDown}
            iconSlide="down"
            variant={PHASE_NAV.variant}
            size={PHASE_NAV.size}
            onClick={go}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * The navigation assistant (P27-74; P27-85): a small glowing orb at the bottom of the screen,
 * its glow breathing slowly. On desktop the mouse grows the dot into the next chapter's button
 * as it arrives (touch: a tap; keyboard: Enter): the pill opens out of the dot, then the label
 * writes in. Clicking the button glides there: it folds back into its dot, which shrinks and
 * drops out of sight; once the glide is over (or the visitor took the scroll back) and the story
 * has settled, the dot rises again.
 * The button also folds back after PHASE_NAV.autoCloseSeconds unused, on Esc, on a click
 * elsewhere, as the story moves on, or as a panel opens.
 * - It offers the next chapter from wherever you are (nextStopAt).
 * - It stays away on the hero's first screen, while a panel is open (the story is frozen), and
 *   once Contact begins.
 *
 * Portalled to the body (ScrollSmoother's transformed content re-bases `fixed`); with reduced
 * motion the journey isn't pinned, so there's no assistant.
 */
const NavAssistant = () => {
  const client = useIsClient();
  const reduced = useReducedMotion();
  useEffect(stopGlideOnInput, []);
  if (!client || reduced) return null;
  return createPortal(<NavAssistantView />, document.body);
};

export default NavAssistant;
