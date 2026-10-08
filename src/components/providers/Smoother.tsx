"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import { tickerAdds } from "#/components/providers/tickerAdds";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

export type SmootherProps = {
  wrapperRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  /** Called once the smoother is in place. */
  onReady: () => void;
};

/**
 * Creates the smoother (and kills it when it unmounts). Renders nothing. It renders after the
 * wrapper (P27-94): on a client-side mount (the mode switch) its effect runs as its siblings
 * commit, so the wrapper and content refs must already be set. Part of the journey's motion
 * code (P27-95: fetched apart, journeyMotion.ts), so the calm mode never loads it.
 */
const Smoother = ({ wrapperRef, contentRef, onReady }: SmootherProps) => {
  useGSAP(() => {
    let smoother: ScrollSmoother | undefined;
    const removeTickerAdds = tickerAdds(() => {
      smoother = ScrollSmoother.create({
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
    });
    onReady();
    return () => {
      // A glide still in flight would go on driving a dead smoother (P27-94: the mode switch
      // unmounts the journey mid-glide).
      if (smoother) {
        gsap.killTweensOf(smoother);
        smoother.kill();
      }
      // What it left on GSAP's ticker (iOS), so the ticker can sleep once the journey has gone.
      removeTickerAdds();
    };
  });
  return null;
};

export default Smoother;
