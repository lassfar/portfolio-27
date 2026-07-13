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

const useTextsWritingMotion = <T extends HTMLElement>({
  elements,
  scrollTrigger,
  dependecies,
}: Props<T>) => {
  useGSAP(
    () => {
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

      const splitTexts: SplitText[] = [];

      for (let i = 0; i < elements.length; i++) {
        // Split by words AND chars so whitespace between words is preserved
        // (splitting by chars alone collapses spaces inside nested spans).
        const splitText = new SplitText(elements[i].ref.current, {
          type: "words,chars",
        });
        splitTexts.push(splitText);
      }

      for (let i = 0; i < splitTexts.length; i++) {
        timeline.from(splitTexts[i].chars, {
          ...vars,
          ...elements[i].vars,
          position: elements[i].position,
        });
      }

      return () => {
        for (let i = 0; i < timeline.length; i++) {
          timeline[i].revert();
        }
      };
    },
    { ...dependecies }
  );
};

export default useTextsWritingMotion;
