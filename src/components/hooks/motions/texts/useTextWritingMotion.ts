"use client";

import gsap, { SplitText } from "gsap/all";
import { RefObject } from "react";
import { useGSAP, useGSAPConfig } from "@gsap/react";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(SplitText);

type Props<T extends HTMLElement> = {
  element: {
    ref: RefObject<T | null>;
    vars?: gsap.TweenVars;
    position?: gsap.Position;
  };
  dependecies?: useGSAPConfig;
};

const useTextWritingMotion = <T extends HTMLElement>({
  element,
  dependecies,
}: Props<T>) => {
  useGSAP(
    () => {
      const vars: gsap.TweenVars = {
        opacity: 0,
        translateX: -40,
        scale: 0,
        stagger: 0.025,
        duration: 0.25,
        ease: "sine.out",
        lineBreak: "none",
      };

      const splitText = new SplitText(element.ref.current, {
        type: "chars",
      });

      gsap.from(splitText.chars, {
        ...vars,
        ...element.vars,
        position: element.position,
      });

      return () => splitText.revert();
    },
    { ...dependecies }
  );
};

export default useTextWritingMotion;
