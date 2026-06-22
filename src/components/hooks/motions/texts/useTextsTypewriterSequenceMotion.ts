"use client";

import gsap, { SplitText } from "gsap/all";
import { RefObject } from "react";
import { useGSAP, useGSAPConfig } from "@gsap/react";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

/**
 * Plays a sequence of text elements on a single timeline, one at a time:
 * each element is "written" in character by character, held, then "reverse
 * written" (erased) before the next one is written.
 *
 * Sequence for 3 elements:
 *   Write 1 → erase 1 → Write 2 → erase 2 → Write 3 (stays, unless loop)
 *
 * Layout note: only one element is visible at a time, but hidden elements
 * still occupy layout space. Stack the elements (same CSS grid cell or a
 * relative parent with absolute children) so the page doesn't jump.
 *
 * @example
 * useTextsTypewriterSequenceMotion({
 *   elements: [titleRef1, titleRef2, titleRef3],
 *   hold: 1,
 *   writeVars: { color: "var(--color-peach)" },
 * });
 */
type Props<T extends HTMLElement> = {
  /** Refs of the text elements to play in order. */
  elements: Array<RefObject<T | null>>;
  /** Seconds each element stays fully visible before it's erased. */
  hold?: number;
  /** Seconds to wait before the sequence starts. */
  startDelay?: number;
  /** Loop the whole sequence (also erases the last element to restart cleanly). */
  loop?: boolean;
  /** GSAP vars for the "write in" tween (merged over sensible defaults). */
  writeVars?: gsap.TweenVars;
  /** GSAP vars for the "reverse write / erase" tween (merged over sensible defaults). */
  eraseVars?: gsap.TweenVars;
  /** Dependency config forwarded to useGSAP (scope, dependencies, revertOnUpdate). */
  dependencies?: useGSAPConfig;
};

const useTextsTypewriterSequenceMotion = <T extends HTMLElement>({
  elements,
  hold = 1,
  startDelay = 0,
  loop = false,
  writeVars,
  eraseVars,
  dependencies,
}: Props<T>) => {
  useGSAP(
    () => {
      const nodes = elements
        .map((el) => el.current)
        .filter((node): node is T => node !== null);

      if (nodes.length === 0) return;

      // Defaults: write chars IN (hidden -> visible), erase chars OUT.
      const writeDefaults: gsap.TweenVars = {
        opacity: 0,
        y: 15,
        stagger: 0.04,
        duration: 0.5,
        ease: "back.out(2)",
        lineBreak: "none",
      };
      const eraseDefaults: gsap.TweenVars = {
        opacity: 0,
        y: -15,
        stagger: 0.03,
        duration: 0.4,
        ease: "power2.in",
        lineBreak: "none",
      };

      // Split every element into characters up front.
      const splits = nodes.map(
        (node) => new SplitText(node, { type: "chars" })
      );

      // Only the first element is visible at the start.
      gsap.set(nodes, { autoAlpha: 0 });
      gsap.set(nodes[0], { autoAlpha: 1 });

      const timeline = gsap.timeline({
        delay: startDelay,
        repeat: loop ? -1 : 0,
      });

      for (let i = 0; i < nodes.length; i++) {
        const isLast = i === nodes.length - 1;

        // Write the current element in.
        timeline.from(splits[i].chars, { ...writeDefaults, ...writeVars });

        // Erase it — unless it's the last one and we're not looping.
        if (!isLast || loop) {
          const next = nodes[(i + 1) % nodes.length];

          timeline
            .to(
              splits[i].chars,
              { ...eraseDefaults, ...eraseVars },
              `+=${hold}`
            )
            // Instantly swap which element is on stage.
            .set(nodes[i], { autoAlpha: 0 })
            .set(next, { autoAlpha: 1 });
        }
      }

      // Clean up SplitText and the timeline on unmount / dependency change.
      return () => {
        timeline.kill();
        splits.forEach((split) => split.revert());
      };
    },
    { ...dependencies }
  );
};

export default useTextsTypewriterSequenceMotion;
