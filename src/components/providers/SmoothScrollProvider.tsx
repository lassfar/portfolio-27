"use client";

import { ReactNode, useRef, useState } from "react";
import { useLoaded } from "#/components/hooks/useLoaded";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { GateLive, useGateLive } from "#/components/pages/home/motion/gateLive";

/**
 * Wraps the journey in GSAP ScrollSmoother for inertia-based smooth scrolling (the calm
 * book scrolls natively). It starts once the journey is the mode on screen (useGateLive,
 * P27-93): on the hidden page it would take over the book's scrolling.
 *
 * ScrollSmoother requires a fixed wrapper containing a single content child:
 *   #smooth-wrapper > #smooth-content
 *
 * It drives the same scroll position as ScrollTrigger, so scrub animations
 * (e.g. the About half-sun) stay perfectly in sync. `effects: true` activates
 * the `data-speed` / `data-lag` parallax attributes already present on shapes.
 *
 * Its content goes live (useGateLive) only once the smoother is in place, so the journey's
 * pin is always made after it. A pin made before is reverted and re-made by the smoother; if
 * that pin is then rebuilt (React replays new effects in development), its first wrapper
 * stays behind, and the page can't scroll.
 */
const SmoothScrollProvider = ({ children }: { children: ReactNode }) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const live = useGateLive();
  // The smoother itself is the journey's motion code (P27-95), fetched apart: the calm mode
  // never loads ScrollSmoother.
  const journey = useLoaded(loadJourneyMotion, live);
  const [ready, setReady] = useState(false);

  return (
    <>
      <div id="smooth-wrapper" ref={wrapperRef}>
        <div id="smooth-content" ref={contentRef}>
          <GateLive value={live && ready}>{children}</GateLive>
        </div>
      </div>
      {live && journey && (
        <journey.Smoother
          wrapperRef={wrapperRef}
          contentRef={contentRef}
          onReady={() => setReady(true)}
        />
      )}
    </>
  );
};

export default SmoothScrollProvider;
