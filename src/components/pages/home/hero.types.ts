import type { RefObject } from "react";

/** The Hero's elements its motion drives (HeroMotion). */
export type HeroRefs = {
  containerRef: RefObject<HTMLDivElement | null>;
  logoRef: RefObject<HTMLDivElement | null>;
  eyebrowRef: RefObject<HTMLParagraphElement | null>;
  headlineRef: RefObject<HTMLHeadingElement | null>;
  subRef: RefObject<HTMLParagraphElement | null>;
  ctaRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  aboutRevealRef: RefObject<HTMLDivElement | null>;
  aboutTitleRef: RefObject<HTMLHeadingElement | null>;
  aboutPara1Ref: RefObject<HTMLParagraphElement | null>;
  aboutPara2Ref: RefObject<HTMLParagraphElement | null>;
  craftRef: RefObject<HTMLDivElement | null>;
  contactRef: RefObject<HTMLDivElement | null>;
};
