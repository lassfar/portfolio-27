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

const useGradientBgMotion = <T extends HTMLElement | SVGSVGElement>({
  element,
  dependecies,
}: Props<T>) => {
  useGSAP(
    () => {
      const vars: gsap.TweenVars = {
        background: "linear-gradient(90deg, #2489ff 0%, #ffb266 100%)",
        duration: 10,
        ease: "none",
        repeat: -1,
        yoyo: true,
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

export default useGradientBgMotion;
