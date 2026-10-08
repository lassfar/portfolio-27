"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import IconButton from "#/components/UI/buttons/IconButton";
import { Calm, Lively } from "#/components/UI/icons/motion";
import { useIsClient } from "#/components/hooks/useIsClient";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { PAGE_CONTROLS_ID } from "#/components/pages/home/motion/pageControls";
import { preloadScene } from "#/components/three.js/scene/preload";
import { useCalm, useMotion } from "#/stores/useMotion";

/**
 * The "Reduce motion" switch (P27-92): a glass icon button in the top-right corner, the
 * same in both modes. Pressed, the site is calm (short fades only, nothing moving); not
 * pressed, full motion. It starts from the device setting and remembers the visitor's
 * choice (stores/useMotion). It steps away while a panel is open, whose controls take the
 * corner. Portalled first in the page (the layout's page controls, P27-95), so it's the first
 * Tab stop; only on the client, where its state lives. Shown to every visitor (P27-93): with motion on, it's how the
 * journey's motion stops (WCAG 2.2.2). The page then switches to the other mode live (ModeGate,
 * P27-94); it stays above the transition screen meanwhile (`switching:`), with the focus. In
 * the calm mode, the pointer or the focus lingering on it fetches the journey, in case.
 */
const MotionSwitch = () => {
  const client = useIsClient();
  const calm = useCalm();
  const fetchJourney = useLingerFetch(calm);
  if (!client) return null;
  return createPortal(
    <div
      data-motion-switch
      data-mode-keep
      {...fetchJourney}
      className="fixed top-4.5 right-4.5 z-46 transition-[opacity,visibility] duration-300 sm:top-6 sm:right-6 panel-open:invisible panel-open:opacity-0 switching:z-70"
    >
      <IconButton
        icon={calm ? Calm : Lively}
        label="Reduce motion"
        pressed={calm}
        tooltip={calm ? "Reduce motion · on" : "Reduce motion · off"}
        onClick={() => useMotion.getState().setChoice(calm ? "full" : "calm")}
      />
    </div>,
    document.getElementById(PAGE_CONTROLS_ID) ?? document.body,
  );
};

/** How long the pointer or the focus stays on the switch before the journey is fetched. */
const LINGER_MS = 200;

/**
 * In the calm mode, the pointer or the focus lingering on the switch fetches the journey (its
 * motion code and the 3D, ~0.5 MB), so a switch to motion starts sooner (P27-94). Only on a
 * lingering hover (not one passing over it, nor the focus passing by: it's the first Tab
 * stop), and never when the browser asks to save data (P27-95).
 */
function useLingerFetch(calm: boolean) {
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const start = () => {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } })
      .connection;
    if (!calm || connection?.saveData) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => void Promise.all([loadJourneyMotion(), preloadScene()]).catch(() => undefined),
      LINGER_MS,
    );
  };
  const stop = () => window.clearTimeout(timer.current);
  return { onPointerEnter: start, onPointerLeave: stop, onFocus: start, onBlur: stop };
}

export default MotionSwitch;
