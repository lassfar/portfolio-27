"use client";

import { ReactNode, RefObject, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import { GateLive, useGateLive } from "#/components/pages/home/motion/gateLive";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

type SmootherProps = {
  wrapperRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  /** Called once the smoother is in place. */
  onReady: () => void;
};

/** Creates the smoother (and kills it when it unmounts). Renders nothing. */
const Smoother = ({ wrapperRef, contentRef, onReady }: SmootherProps) => {
  useGSAP(() => {
    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      smooth: 1.2, // seconds it takes to "catch up" to the scroll position
      effects: true, // enable data-speed / data-lag parallax
      normalizeScroll: true, // smooth out mobile address-bar jumps
      // On focus it scrolls to the focused element if it's off screen — only for the page's
      // own content: the overlays portalled outside it (the panel, the photo viewer) are
      // fixed, so a control still sliding in (a panel's Close) mustn't scroll the story.
      onFocusIn: (_: ScrollSmoother, e: Event) =>
        e.target instanceof Node && contentRef.current?.contains(e.target) === true,
    });
    onReady();
    return () => smoother.kill();
  });
  return null;
};

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
  const [ready, setReady] = useState(false);

  return (
    <>
      {live && (
        <Smoother wrapperRef={wrapperRef} contentRef={contentRef} onReady={() => setReady(true)} />
      )}
      <div id="smooth-wrapper" ref={wrapperRef}>
        <div id="smooth-content" ref={contentRef}>
          <GateLive value={live && ready}>{children}</GateLive>
        </div>
      </div>
    </>
  );
};

export default SmoothScrollProvider;
