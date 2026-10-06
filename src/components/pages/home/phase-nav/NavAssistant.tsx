"use client";

import { useGSAP } from "@gsap/react";
import clsx from "clsx";
import gsap from "gsap";
import { SplitText } from "gsap/all";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowDown } from "lucide-react";
import Button from "#/components/UI/buttons/Button";
import Tooltip from "#/components/UI/tooltip/Tooltip";
import {
  glideToJourney,
  stopGlideOnInput,
} from "#/components/pages/home/scroll/glide";
import { TIMELINE } from "#/components/pages/home/timeline/config";
import { mpAt } from "#/components/three.js/star/config";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { selectIsOpen, usePanelStore } from "#/stores/usePanelStore";
import { PHASE_NAV, glideSeconds, nextStopAt, type PhaseStop } from "./config";

gsap.registerPlugin(useGSAP, SplitText);

/** A design token's hex (e.g. "#ffa14a") as an rgba() maker, so GSAP can tween it. */
function rgba(hex: string): (alpha: number) => string {
  const n = parseInt(hex.trim().slice(1), 16);
  return (alpha) =>
    `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * The navigation assistant (P27-74): a small glowing orb at the bottom of the screen,
 * its glow breathing slowly. On desktop the mouse grows the dot into the next chapter's
 * button as it arrives (touch: a tap; keyboard: Enter) (the pill opens out of the dot, then the label
 * writes in). Clicking the button glides there and the button folds back into the orb:
 * the same animation, reversed. It also folds back on scroll, after
 * PHASE_NAV.autoCloseSeconds, on Esc or on a click elsewhere.
 * - It offers the next chapter from wherever you are (nextStopAt).
 * - It stays away on the hero's first screen, while a side panel is open (the story is
 *   frozen), and once Contact begins.
 *
 * Portalled to the body (ScrollSmoother's transformed content re-bases `fixed`); with
 * reduced motion the journey isn't pinned, so there's no assistant.
 */
const NavAssistant = () => {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [past, setPast] = useState(false); // beyond the hero's first screen
  const [stop, setStop] = useState<PhaseStop | null>(null); // offered (frozen while the button is out)
  const [panelOpen, setPanelOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const orb = useRef<HTMLButtonElement>(null);
  const reveal = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const out = useRef(false); // the button is out: opening, open or folding back
  const latest = useRef<PhaseStop | null>(null);
  const anim = useRef<{ tl: gsap.core.Timeline; split: SplitText } | null>(
    null,
  );
  const autoClose = useRef(0);

  const { contextSafe } = useGSAP({ scope: root });

  // Fold the button back into the orb: the opening, played in reverse.
  const close = contextSafe((refocus = false) => {
    const a = anim.current;
    if (!a || a.tl.reversed()) return;
    window.clearTimeout(autoClose.current);
    setOpen(false);
    a.tl.reverse();
    if (refocus) orb.current?.focus({ preventScroll: true });
  });
  const closeRef = useRef(close);
  closeRef.current = close;

  // Grow the dot into the button: a shell that starts as the orb (its size, colour and
  // layered glow) stretches into the button's pill while cooling from peach to glass; the real
  // button then takes over and its label writes in, letter by letter.
  const openButton = contextSafe((byHover = false) => {
    const r = reveal.current;
    const sh = shell.current;
    const glow = orb.current?.querySelector(".nav-assistant__glow");
    const label = r?.querySelector("[data-button-label]");
    if (!r || !sh || !glow || !label || out.current) return;
    out.current = true;
    setOpen(true);
    const split = new SplitText(label, { type: "chars" });
    const icon = r.querySelector("[data-button-icon]");
    const letters = icon ? [...split.chars, icon] : split.chars;
    const css = getComputedStyle(document.documentElement);
    const peach = rgba(css.getPropertyValue("--color-peach"));
    const lightPeach = rgba(css.getPropertyValue("--color-light-peach"));
    const darkPeach = rgba(css.getPropertyValue("--color-dark-peach"));
    const frost = rgba(css.getPropertyValue("--color-gray-slate")); // the buttons' frosted glass
    // The shell lands on the revealed button's own glass + ring (UI/Button's VARIANT tones).
    const landing =
      PHASE_NAV.variant === "outline"
        ? { fill: peach(0.06), ring: peach(0.7) }
        : { fill: frost(0.1), ring: peach(0.55) };
    const d = glow.getBoundingClientRect().width; // the orb as seen (hover grows it)
    const T = PHASE_NAV.revealSeconds;
    const tl = gsap
      .timeline({
        defaults: { ease: "sine.inOut" },
        onComplete: () =>
          r.querySelector("button")?.focus({ preventScroll: true }),
        onReverseComplete: () => {
          split.revert();
          gsap.set([r, sh], { autoAlpha: 0 });
          gsap.set(glow, { clearProps: "opacity,visibility" });
          anim.current = null;
          out.current = false;
          setStop(latest.current);
        },
      })
      .set(sh, {
        autoAlpha: 1,
        width: d,
        height: d,
        backgroundColor: peach(1),
        boxShadow: `0 0 6px 1px ${lightPeach(0.75)}, 0 0 14px 4px ${peach(0.55)}, 0 0 32px 10px ${darkPeach(0.22)}, inset 0 0 0 1px ${peach(0)}`,
      })
      .set(r, { autoAlpha: 0 })
      .set(letters, { autoAlpha: 0, y: 3 })
      .to(glow, { autoAlpha: 0, duration: T * 0.25 }, 0)
      .to(
        sh,
        {
          width: r.offsetWidth,
          height: r.offsetHeight,
          backgroundColor: landing.fill,
          boxShadow: `0 0 0px 0px ${lightPeach(0)}, 0 0 0px 0px ${peach(0)}, 0 0 0px 0px ${darkPeach(0)}, inset 0 0 0 1px ${landing.ring}`,
          duration: T,
        },
        0,
      )
      .to(r, { autoAlpha: 1, duration: T * 0.3 }, T * 0.8)
      .to(sh, { autoAlpha: 0, duration: T * 0.3 }, T * 0.95)
      .to(
        letters,
        { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.03, ease: "sine.out" },
        T * 0.9,
      );
    anim.current = { tl, split };
    // Opened by a hover, it stays while the pointer does (leaving folds it back).
    if (!byHover) {
      autoClose.current = window.setTimeout(
        () => closeRef.current(),
        PHASE_NAV.autoCloseSeconds * 1000,
      );
    }
  });

  // Desktop: the mouse opens it (after a short intent pause, so a pass-over doesn't),
  // and leaving the orb + button folds it back after a short grace (so slipping off the
  // edge doesn't). Touch and keyboard keep the tap / Enter.
  const hoverTimer = useRef(0);
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(hoverTimer.current);
    if (!out.current) {
      hoverTimer.current = window.setTimeout(
        () => openButton(true),
        PHASE_NAV.hoverOpenDelay * 1000,
      );
    }
  };
  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    window.clearTimeout(hoverTimer.current);
    hoverTimer.current = window.setTimeout(
      () => closeRef.current(),
      PHASE_NAV.hoverCloseDelay * 1000,
    );
  };
  useEffect(() => () => window.clearTimeout(hoverTimer.current), []);

  // Follow the story: what to offer next, whether we're past the hero, and scrolling
  // folds an open button back.
  useEffect(() => {
    setMounted(true);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const update = (mp: number) => {
      latest.current = nextStopAt(mp);
      if (!out.current) setStop(latest.current);
      setPast(mp >= mpAt(TIMELINE.showAfter));
      closeRef.current();
    };
    const syncPanels = () => {
      const isOpen = selectIsOpen(usePanelStore.getState());
      setPanelOpen(isOpen);
      if (isOpen) closeRef.current();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current(true);
    };
    const onPointerDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) closeRef.current();
    };
    update(useJourneyScroll.getState().progress);
    syncPanels();
    const unsubscribe = [
      useJourneyScroll.subscribe((s) => update(s.progress)),
      usePanelStore.subscribe(syncPanels),
    ];
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => {
      unsubscribe.forEach((u) => u());
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointerDown, {
        capture: true,
      });
      window.clearTimeout(autoClose.current);
    };
  }, []);

  useEffect(stopGlideOnInput, []);

  // Clicking the button: glide to the chapter and fold back into the orb.
  const go = () => {
    if (!stop) return;
    const from = useJourneyScroll.getState().progress;
    glideToJourney(
      stop.target,
      glideSeconds(stop.target - from),
      PHASE_NAV.ease,
      "assistant",
    );
    close();
  };

  if (!mounted || reduced) return null;

  const visible = past && stop !== null && !panelOpen;
  return createPortal(
    <div
      ref={root}
      className={clsx(
        "nav-assistant",
        visible && "is-visible",
        open && "is-open",
      )}
      style={{ "--na-orb": `${PHASE_NAV.orbSize}px` } as CSSProperties}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <button
        ref={orb}
        type="button"
        className="nav-assistant__orb group/tip"
        aria-label={stop ? `Next chapter: ${stop.name}` : "Next chapter"}
        aria-expanded={open}
        tabIndex={visible && !open ? 0 : -1}
        onClick={() => openButton()}
      >
        <span className="nav-assistant__glow" />
        {/* After a short hover, until the button grows out of the orb. */}
        <Tooltip side="above" delayed open={open ? false : undefined}>
          Next chapter
        </Tooltip>
      </button>
      <div ref={shell} className="nav-assistant__shell" aria-hidden="true" />
      <div ref={reveal} className="nav-assistant__reveal" aria-hidden={!open}>
        <Button
          label={stop?.name ?? ""}
          icon={ArrowDown}
          iconSlide="down"
          variant={PHASE_NAV.variant}
          size={PHASE_NAV.size}
          tabIndex={open ? 0 : -1}
          onClick={go}
        />
      </div>
    </div>,
    document.body,
  );
};

export default NavAssistant;
