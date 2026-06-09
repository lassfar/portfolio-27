"use client";

import gsap, { SplitText } from "gsap/all";
import { RefObject } from "react";
import { useGSAP, useGSAPConfig } from "@gsap/react";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

type Props<T extends HTMLElement> = {
  elements: Array<{
    ref: RefObject<T | null>;
    vars?: gsap.TweenVars;
    position?: gsap.Position;
  }>;
  dependecies?: useGSAPConfig;
};

const useTextsWritingMotion = <T extends HTMLElement>({
  elements,
  dependecies,
}: Props<T>) => {
  useGSAP(
    () => {
      const timeline = gsap.timeline();

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
        const splitText = new SplitText(elements[i].ref.current, {
          type: "chars",
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
