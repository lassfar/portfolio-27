"use client";

import { useEffect, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import { useIsClient } from "#/components/hooks/useIsClient";
import { GateLive } from "#/components/pages/home/motion/gateLive";
import { choiceKept, reloadAddress } from "#/components/pages/home/motion/reload";
import { motionMode, type MotionChoice } from "#/stores/motionPreference";
import { isCalm, selectCalm, useMotion } from "#/stores/useMotion";

gsap.registerPlugin(ScrollTrigger);

/**
 * While the page loads both modes are in it, and CSS shows the one `data-motion` names (set
 * before the first paint, by the head script). Without a script there's no `data-motion`:
 * the book, which reads without one.
 */
const LOADING: Record<MotionChoice, string> = {
  full: "hidden full:contents",
  calm: "contents full:hidden",
};

/** Reloads the page into the visitor's new mode, at its top. */
function reloadInto(mode: MotionChoice, device: boolean) {
  history.replaceState(
    history.state,
    "",
    reloadAddress(location.href, mode, choiceKept(mode, device)),
  );
  // Don't bring back where the other mode was scrolled to.
  ScrollTrigger.clearScrollMemory("manual");
  location.reload();
}

type Props = {
  /** The journey: the story in motion (3D). */
  full: ReactNode;
  /** The calm book: the story as a book (reduced motion). */
  calm: ReactNode;
  /** When the visitor switches modes, reload into the other one (the site; never Storybook). */
  reloadOnChange?: boolean;
};

/**
 * One page, two ways to tell the story (P27-93): the journey with motion, the calm book in
 * the calm mode. Both are rendered on the server, and CSS shows the right one at the first
 * paint. Once the page has loaded, the mode is read once: the other one is removed, and this
 * one is told it is live (gateLive), so only then does it start (the journey's pin, scroll
 * and 3D; the book's dots). Each slot keeps the same element throughout, so React keeps
 * what it hydrated.
 *
 * Switching modes reloads the page (the live swap is Phase 3, P27-94): the visitor's choice,
 * or the device setting changed during the visit.
 */
const ModeGate = ({ full, calm, reloadOnChange = false }: Props) => {
  const client = useIsClient();
  // The store's real state: read in the browser's first render (the hydration's store
  // snapshot is the server's), and kept for this page.
  const [mode] = useState(() => motionMode(isCalm()));

  useEffect(() => {
    if (!reloadOnChange) return;
    return useMotion.subscribe((now) => {
      const next = motionMode(selectCalm(now));
      if (next !== mode) reloadInto(next, now.device);
    });
  }, [mode, reloadOnChange]);

  const slot = (slotMode: MotionChoice, tree: ReactNode) =>
    client && slotMode !== mode ? null : (
      <GateLive value={client}>
        <div className={client ? "contents" : LOADING[slotMode]}>{tree}</div>
      </GateLive>
    );

  return (
    <>
      {slot("full", full)}
      {slot("calm", calm)}
    </>
  );
};

export default ModeGate;
