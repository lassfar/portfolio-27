"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger, SplitText } from "gsap/all";
import useTextsWritingMotion from "#/components/hooks/motions/texts/useTextsWritingMotion";
import useCosmicJourney from "#/components/pages/home/hooks/useCosmicJourney";
import type { HeroRefs } from "#/components/pages/home/hero.types";
import { useSceneIntro } from "#/stores/useSceneIntro";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

/**
 * The Hero's motion: the headline writing in, the intro around it, and the whole journey.
 * Mounted once the journey is the mode on screen (ModeGate, P27-93), after Hero's markup, so
 * every ref is set; renders nothing. Part of the journey's motion code (P27-95: fetched apart,
 * journeyMotion.ts), so the calm mode never loads it.
 */
const HeroMotion = ({
  containerRef,
  logoRef,
  eyebrowRef,
  headlineRef,
  subRef,
  ctaRef,
  contentRef,
  aboutRevealRef,
  aboutTitleRef,
  aboutPara1Ref,
  aboutPara2Ref,
  craftRef,
  contactRef,
}: HeroRefs) => {
  // Headline writes in, character by character.
  useTextsWritingMotion({
    elements: [
      {
        ref: headlineRef,
        vars: {
          translateX: 0,
          scale: 1,
          y: 24,
          stagger: 0.03,
          duration: 0.6,
          ease: "power3.out",
        },
      },
    ],
  });

  // Logo, eyebrow, sub-line and button fade up around the headline.
  useGSAP(() => {
    const tl = gsap.timeline();
    tl.from(logoRef.current, {
      opacity: 0,
      y: -10,
      duration: 0.8,
      ease: "power2.out",
    })
      .from(eyebrowRef.current, { opacity: 0, y: 14, duration: 0.6, ease: "power2.out" }, 0.2)
      .from(subRef.current, { opacity: 0, y: 18, duration: 0.9, ease: "power2.out" }, 1.0)
      .from(ctaRef.current, { opacity: 0, y: 14, duration: 0.7, ease: "power2.out" }, 1.4);

    // Intro scene spin — runs over the SAME duration as this text intro, so the
    // cosmos finishes turning exactly when the text has landed. Full speed
    // immediately (ease-out).
    const setIntro = useSceneIntro.getState().setProgress;
    const spin = { v: 0 };
    setIntro(0);
    gsap.to(spin, {
      v: 1,
      duration: tl.totalDuration(),
      ease: "power2.out",
      onUpdate: () => setIntro(spin.v),
    });
  });

  // The whole cosmic journey — one pinned ScrollTrigger drives the star, the
  // Saturn assembly, the About reveal, the folded-in Craft, the fly-away, and (at
  // the very end, over the galaxy) the Contact form.
  useCosmicJourney({
    containerRef,
    contentRef,
    logoRef,
    aboutRevealRef,
    aboutTitleRef,
    aboutPara1Ref,
    aboutPara2Ref,
    craftRef,
    contactRef,
  });

  return null;
};

export default HeroMotion;
