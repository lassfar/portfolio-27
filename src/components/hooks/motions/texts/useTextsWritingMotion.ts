"use client";

import gsap, { ScrollTrigger, SplitText } from "gsap/all";
import { RefObject } from "react";
import { useGSAP, useGSAPConfig } from "@gsap/react";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);
gsap.registerPlugin(ScrollTrigger);

type Props<T extends HTMLElement> = {
  elements: Array<{
    ref: RefObject<T | null>;
    vars?: gsap.TweenVars;
    position?: gsap.Position;
  }>;
  /** Optional ScrollTrigger — when set, the write-in plays ONCE as the trigger
   *  enters view (instead of on mount). Use e.g. `{ trigger, start: "top 80%",
   *  toggleActions: "play none none reverse" }`. */
  scrollTrigger?: ScrollTrigger.Vars;
  dependecies?: useGSAPConfig;
};

/** At most this long to wait for a title's font before writing it in anyway (ms). */
const FONT_WAIT_MS = 1200;

const useTextsWritingMotion = <T extends HTMLElement>({
  elements,
  scrollTrigger,
  dependecies,
}: Props<T>) => {
  useGSAP(
    (_, contextSafe) => {
      const targets = elements
        .map((e) => e.ref.current)
        .filter((el): el is T => el !== null);
      if (!targets.length || !contextSafe) return;

      const splitTexts: SplitText[] = [];
      let cancelled = false;

      const play = contextSafe(() => {
        if (cancelled) return;
        gsap.set(targets, { autoAlpha: 1 });
        const timeline = gsap.timeline(
          scrollTrigger ? { scrollTrigger } : undefined
        );

        const vars: gsap.TweenVars = {
          opacity: 0,
          translateX: -40,
          scale: 0,
          stagger: 0.025,
          duration: 0.25,
          ease: "sine.out",
          lineBreak: "none",
        };

        for (let i = 0; i < elements.length; i++) {
          // Split by words AND chars so whitespace between words is preserved
          // (splitting by chars alone collapses spaces inside nested spans).
          const splitText = new SplitText(elements[i].ref.current, {
            type: "words,chars",
          });
          splitTexts.push(splitText);
          timeline.from(splitText.chars, {
            ...vars,
            ...elements[i].vars,
            position: elements[i].position,
          });
        }
      });

      // Write in only once the text's own font is in (P27-78): split with the fallback
      // font, the letters would write in, then jump when the real one swaps in. Hidden
      // meanwhile; after FONT_WAIT_MS it plays anyway.
      gsap.set(targets, { autoAlpha: 0 });
      const fontsIn = Promise.all(
        targets.map((el) =>
          document.fonts?.load(`1em ${getComputedStyle(el).fontFamily}`)
        )
      );
      const timeout = new Promise((resolve) =>
        window.setTimeout(resolve, FONT_WAIT_MS)
      );
      void Promise.race([fontsIn, timeout]).then(play, play);

      return () => {
        cancelled = true;
        splitTexts.forEach((split) => split.revert());
      };
    },
    { ...dependecies }
  );
};

export default useTextsWritingMotion;
