"use client";

import { ReactNode, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother);

/**
 * Wraps the app in GSAP ScrollSmoother for inertia-based smooth scrolling.
 *
 * ScrollSmoother requires a fixed wrapper containing a single content child:
 *   #smooth-wrapper > #smooth-content
 *
 * It drives the same scroll position as ScrollTrigger, so scrub animations
 * (e.g. the About half-sun) stay perfectly in sync. `effects: true` activates
 * the `data-speed` / `data-lag` parallax attributes already present on shapes.
 */
type Props = {
  children: ReactNode;
};

const SmoothScrollProvider = ({ children }: Props) => {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    // Respect users who prefer reduced motion — skip smoothing entirely.
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const smoother = ScrollSmoother.create({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      smooth: 1.2, // seconds it takes to "catch up" to the scroll position
      effects: true, // enable data-speed / data-lag parallax
      normalizeScroll: true, // smooth out mobile address-bar jumps
    });

    return () => smoother.kill();
  });

  return (
    <div id="smooth-wrapper" ref={wrapperRef}>
      <div id="smooth-content" ref={contentRef}>
        {children}
      </div>
    </div>
  );
};

export default SmoothScrollProvider;
