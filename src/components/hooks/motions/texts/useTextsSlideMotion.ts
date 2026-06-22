"use client";

import gsap from "gsap";
import { RefObject } from "react";
import { useGSAP, useGSAPConfig } from "@gsap/react";

gsap.registerPlugin(useGSAP);

/**
 * Cycles through a list of text elements one at a time, sliding the current
 * one out while the next one slides in. Only one element is visible at a time.
 *
 * Layout requirement: the consumer must stack the elements on top of each
 * other (e.g. place them in the same CSS grid cell with `col-start-1 row-start-1`,
 * or use absolute positioning) so they overlap. This hook only animates
 * `opacity` and `yPercent` — it does not manage layout.
 *
 * @example
 * useTextsSlideMotion({
 *   elements: [title1Ref, title2Ref, title3Ref],
 *   startDelay: 2,   // wait for the intro writing motion to finish
 *   holdDuration: 2, // seconds each title stays on screen
 * });
 */
type Props<T extends HTMLElement> = {
  /** Refs of the elements to cycle through, in display order. */
  elements: Array<RefObject<T | null>>;
  /** Seconds to wait before the first slide begins. Use this to start after another animation. */
  startDelay?: number;
  /** Seconds each element stays fully visible before sliding out. */
  holdDuration?: number;
  /** Duration of a single slide transition in seconds. */
  slideDuration?: number;
  /** Easing for the slide transition. */
  ease?: string;
  /** Loop back to the first element after the last one. */
  loop?: boolean;
  /** Extra GSAP vars merged into every slide tween (e.g. scale, color). */
  vars?: gsap.TweenVars;
  /** Dependency config forwarded to useGSAP (scope, dependencies, revertOnUpdate). */
  dependencies?: useGSAPConfig;
};

const useTextsSlideMotion = <T extends HTMLElement>({
  elements,
  startDelay = 0,
  holdDuration = 2,
  slideDuration = 0.8,
  ease = "power3.inOut",
  loop = true,
  vars,
  dependencies,
}: Props<T>) => {
  useGSAP(
    () => {
      const nodes = elements
        .map((el) => el.current)
        .filter((node): node is T => node !== null);

      if (nodes.length < 2) return;

      // Initial state: only the first element is visible, the rest wait below.
      gsap.set(nodes, { opacity: 0, yPercent: 100 });
      gsap.set(nodes[0], { opacity: 1, yPercent: 0 });

      const timeline = gsap.timeline({
        delay: startDelay,
        repeat: loop ? -1 : 0,
      });

      for (let i = 0; i < nodes.length; i++) {
        // When not looping, leave the last element on screen.
        if (!loop && i === nodes.length - 1) break;

        const current = nodes[i];
        const next = nodes[(i + 1) % nodes.length];

        timeline
          // Slide the current element up and out.
          .to(
            current,
            {
              yPercent: -100,
              opacity: 0,
              duration: slideDuration,
              ease,
              ...vars,
            },
            `+=${holdDuration}`
          )
          // Slide the next element up from below, into view — at the same time.
          .fromTo(
            next,
            { yPercent: 100, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: slideDuration,
              ease,
              ...vars,
            },
            "<"
          );
      }

      return () => {
        timeline.kill();
      };
    },
    { ...dependencies }
  );
};

export default useTextsSlideMotion;
