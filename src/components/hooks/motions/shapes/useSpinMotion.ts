"use client";

import gsap from "gsap/all";
import { RefObject } from "react";
import { useGSAP, useGSAPConfig } from "@gsap/react";

gsap.registerPlugin(useGSAP);

type Props<T extends HTMLElement | SVGSVGElement> = {
  element: {
    ref: RefObject<T | null>;
    vars?: gsap.TweenVars;
    position?: gsap.Position;
  };
  dependecies?: useGSAPConfig;
};

const useSpinMotion = <T extends HTMLElement | SVGSVGElement>({
  element,
  dependecies,
}: Props<T>) => {
  useGSAP(
    () => {
      const vars: gsap.TweenVars = {
        rotate: 360,
        duration: 100,
        repeat: -1,
        ease: "none",
      };

      gsap.to(element.ref.current, {
        ...vars,
        ...element.vars,
        position: element.position,
      });
    },
    { ...dependecies }
  );
};

export default useSpinMotion;
