"use client";

import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import { tickerAdds } from "#/components/providers/tickerAdds";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

/** ScrollTrigger's own lists: proxies [element, vars…], scroll functions [element, y, x…]. */
const { _proxies: proxies, _scrollers: scrollers } = (
  ScrollTrigger as unknown as { core: { _proxies: unknown[]; _scrollers: unknown[] } }
).core;

/**
 * Forgets a killed smoother's wrapper (P27-104). GSAP 3.13's kill leaves it in both lists (the
 * proxy isn't removed, and of its scroll functions only the first goes), so each mode switch
 * kept the old journey's whole tree for the rest of the visit.
 */
const forgetWrapper = (wrapper: Element | null) => {
  if (!wrapper) return;
  const i = proxies.indexOf(wrapper);
  if (i >= 0) proxies.splice(i, 2);
  for (let j = scrollers.length - 1; j >= 0; j--) {
    const entry = scrollers[j];
    if (entry === wrapper || (entry as { target?: unknown } | null)?.target === wrapper) {
      scrollers.splice(j, 1);
    }
  }
};

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
    const wrapper = wrapperRef.current;
    const removeTickerAdds = tickerAdds(() => {
      smoother = ScrollSmoother.create({
        wrapper: wrapperRef.current,
        content: contentRef.current,
        smooth: 1.2, // seconds it takes to "catch up" to the scroll position
        effects: true, // enable data-speed / data-lag parallax
        normalizeScroll: true, // smooth out mobile address-bar jumps
        // On focus it scrolls to the focused element if it's off screen — only for the page's
        // own content: the overlays portalled outside it (the panel, the photo viewer) are
        // fixed, so a control still sliding in (a panel's Close) mustn't scroll the story. Nor
        // inside an overlay that scrolls on its own (Contact where it doesn't fit, P27-101): its
        // scroll shows it, the journey stays.
        onFocusIn: (_: ScrollSmoother, e: Event) =>
          e.target instanceof Element &&
          contentRef.current?.contains(e.target) === true &&
          !e.target.closest("[data-overlay-scroll]"),
      });
    });
    onReady();
    return () => {
      // A glide still in flight would go on driving a dead smoother (P27-94: the mode switch
      // unmounts the journey mid-glide).
      if (smoother) {
        gsap.killTweensOf(smoother);
        smoother.kill();
        forgetWrapper(wrapper);
      }
      // What it left on GSAP's ticker (iOS), so the ticker can sleep once the journey has gone.
      removeTickerAdds();
    };
  });
  return null;
};

export default Smoother;
