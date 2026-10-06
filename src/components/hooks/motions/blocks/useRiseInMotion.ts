"use client";

import gsap from "gsap";
import { RefObject } from "react";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Props<T extends HTMLElement> = {
  /** The container: its parts (`selector`, in page order) rise in one after another. */
  scope: RefObject<T | null>;
  /** It plays again whenever these change (e.g. new content); the last entrance is undone first. */
  dependencies: unknown[];
  /** Which parts rise (default: those marked `data-rise`). */
  selector?: string;
  vars?: gsap.TweenVars;
  /** Seconds between two parts' rises… */
  stagger?: number;
  /** …up to this many (long lists don't keep the last ones waiting). */
  maxSteps?: number;
  /** Adds steps to the same timeline (e.g. a swash's draw), given when a part starts rising. */
  extend?: (timeline: gsap.core.Timeline, riseAt: (part: Element) => number) => void;
};

/**
 * A staggered rise-in (P27-80, P27-83): the container's parts fade in and rise into place
 * one after another, on one GSAP timeline that `extend` can add to — so everything in the
 * entrance is in sync. It lets go of them once done (`clearProps`), so their own hover
 * transitions are untouched. Skipped with reduced motion.
 *
 * @example
 * useRiseInMotion({ scope: contentRef, dependencies: [contentKey] });
 */
const useRiseInMotion = <T extends HTMLElement>({
  scope,
  dependencies,
  selector = "[data-rise]",
  vars,
  stagger = 0.06,
  maxSteps = 12,
  extend,
}: Props<T>) => {
  useGSAP(
    () => {
      const root = scope.current;
      if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const parts = Array.from(root.querySelectorAll(selector));
      const delayOf = (i: number) => Math.min(i, maxSteps) * stagger;
      const timeline = gsap.timeline();
      if (parts.length) {
        timeline.from(
          parts,
          {
            opacity: 0,
            y: 14,
            duration: 0.6,
            ease: "power4.out",
            clearProps: "opacity,transform",
            ...vars,
            stagger: (i: number) => delayOf(i), // last: `riseAt` depends on it
          },
          0,
        );
      }
      extend?.(timeline, (part) => delayOf(Math.max(0, parts.indexOf(part))));
    },
    { scope, dependencies, revertOnUpdate: true },
  );
};

export default useRiseInMotion;
