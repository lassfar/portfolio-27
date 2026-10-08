"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useIsClient } from "#/components/hooks/useIsClient";
import { GateLive } from "#/components/pages/home/motion/gateLive";
import { startModeSwitch } from "#/components/pages/home/motion/modeSwitch";
import ModeVeil from "#/components/pages/home/motion/ModeVeil";
import { motionMode, type MotionChoice } from "#/stores/motionPreference";
import { useModeSwitch } from "#/stores/useModeSwitch";
import { isCalm } from "#/stores/useMotion";

/**
 * While the page loads both modes are in it, and CSS shows the one `data-motion` names (set
 * before the first paint, by the head script). Without a script there's no `data-motion`:
 * the book, which reads without one.
 */
const LOADING: Record<MotionChoice, string> = {
  full: "hidden full:contents",
  calm: "contents full:hidden",
};

/** The transition screen and the switch's status line (P27-94), above the page. */
const SwitchScreen = () => {
  const veil = useModeSwitch((s) => s.veil);
  const status = useModeSwitch((s) => s.status);
  return (
    <>
      {veil && <ModeVeil {...veil} />}
      {createPortal(
        <p role="status" data-mode-keep className="sr-only">
          {status}
        </p>,
        document.body,
      )}
    </>
  );
};

type Props = {
  /** The journey: the story in motion (3D). */
  full: ReactNode;
  /** The calm book: the story as a book (reduced motion). */
  calm: ReactNode;
  /** When the mode changes, switch to the other one live (the site; never Storybook's stand-ins unless asked). */
  switchLive?: boolean;
};

/**
 * One page, two ways to tell the story (P27-93): the journey with motion, the calm book in
 * the calm mode. Both are rendered on the server, and CSS shows the right one at the first
 * paint. Once the page has loaded, the mode is read once: the other one is removed, and this
 * one is told it is live (gateLive), so only then does it start (the journey's pin, scroll
 * and 3D; the book's dots). Each slot keeps the same element throughout, so React keeps
 * what it hydrated.
 *
 * When the mode changes (the visitor's switch, or the device setting during the visit), it
 * switches live (P27-94, motion/modeSwitch): behind the transition screen, the other mode
 * mounts on the client and lands on the same chapter. No reload.
 */
const ModeGate = ({ full, calm, switchLive = false }: Props) => {
  const client = useIsClient();
  // The store's real state: read in the browser's first render (the hydration's store
  // snapshot is the server's), and kept as the mode the page loaded in.
  const [initial] = useState(() => motionMode(isCalm()));
  const mode = useModeSwitch((s) => s.shown) ?? initial;

  useEffect(() => (switchLive ? startModeSwitch(initial) : undefined), [initial, switchLive]);

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
      {client && switchLive && <SwitchScreen />}
    </>
  );
};

export default ModeGate;
