"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import useTextsWritingMotion from "#/components/hooks/motions/texts/useTextsWritingMotion";
import SunriseLogo from "#/components/assets/pictures/logos/sunrise-logo";
import SectionMarker from "#/components/UI/SectionMarker";
import Button from "#/components/UI/buttons/Button";
import Skills from "#/components/pages/home/skills/Skills";
import useCosmicJourney from "#/components/pages/home/hooks/useCosmicJourney";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger, SplitText } from "gsap/all";
import clsx from "clsx";
import { useSceneIntro } from "#/stores/useSceneIntro";

gsap.registerPlugin(useGSAP, ScrollTrigger, ScrollSmoother, SplitText);

// WebGL-only — load on the client, never during SSR. The unified scene holds
// the starfield, the star, the Saturn that assembles from its debris, and (as
// the journey continues) the Saturn's fly-away out into the wider voyage.
const CosmicScene = dynamic(
  () => import("#/components/three.js/scene/CosmicScene"),
  { ssr: false }
);

const Hero = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const headlineRef = useRef<HTMLHeadingElement | null>(null);
  const subRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const aboutRevealRef = useRef<HTMLDivElement | null>(null);
  const aboutTitleRef = useRef<HTMLHeadingElement | null>(null);
  const aboutPara1Ref = useRef<HTMLParagraphElement | null>(null);
  const aboutPara2Ref = useRef<HTMLParagraphElement | null>(null);
  const heroMarkerRef = useRef<HTMLDivElement | null>(null);
  const craftRef = useRef<HTMLDivElement | null>(null);

  // Detect reduced motion on the client (initial false → matches SSR, no
  // hydration mismatch). In reduced motion the overlays lay out in normal flow.
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

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
      .from(
        eyebrowRef.current,
        { opacity: 0, y: 14, duration: 0.6, ease: "power2.out" },
        0.2
      )
      .from(
        subRef.current,
        { opacity: 0, y: 18, duration: 0.9, ease: "power2.out" },
        1.0
      )
      .from(
        ctaRef.current,
        { opacity: 0, y: 14, duration: 0.7, ease: "power2.out" },
        1.4
      );

    // Intro scene spin — runs over the SAME duration as this text intro, so the
    // cosmos finishes turning exactly when the text has landed. Full speed
    // immediately (ease-out). Skipped for reduced motion.
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setIntro = useSceneIntro.getState().setProgress;
    if (reduceMotion) {
      setIntro(1);
    } else {
      const spin = { v: 0 };
      setIntro(0);
      gsap.to(spin, {
        v: 1,
        duration: tl.totalDuration(),
        ease: "power2.out",
        onUpdate: () => setIntro(spin.v),
      });
    }
  });

  // The whole cosmic journey — one pinned ScrollTrigger drives the star, the
  // Saturn assembly, the About reveal, the folded-in Craft, and the fly-away.
  useCosmicJourney({
    containerRef,
    contentRef,
    logoRef,
    heroMarkerRef,
    aboutRevealRef,
    aboutTitleRef,
    aboutPara1Ref,
    aboutPara2Ref,
    craftRef,
  });

  // Nudge the scroll to kick off the journey (the star → Saturn sequence).
  const handleWander = () => {
    const y = window.innerHeight * 1.2;
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo(y, true);
    } else {
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div
      className={clsx(
        "home-hero",
        "relative min-h-screen overflow-hidden",
        "bg-rich-black"
      )}
      ref={containerRef}
    >
      {/* Full-bleed unified cosmos (starfield + star + Saturn), behind content.
          Blurred + dimmed at the end of the journey for the About reveal. */}
      <div className="home-hero__canvas absolute inset-0 z-0 will-change-[filter]">
        <CosmicScene />
      </div>

      {/* Logo, top-left */}
      <div
        className="absolute top-6 left-6 z-10 pointer-events-auto"
        ref={logoRef}
      >
        <SunriseLogo width={56} height={48} className="w-10 sm:w-12 h-auto" />
      </div>

      {/* Section spine — fades out with the hero copy as the journey begins. */}
      <SectionMarker ref={heroMarkerRef} label="ORIGIN" className="z-10" />

      {/* Content overlay — pointer-events-none so drags reach the space;
          interactive children re-enable pointer events. */}
      <section
        className={clsx(
          "home-hero__section",
          "relative z-10 pointer-events-none",
          "w-11/12 mx-auto min-h-screen",
          "flex flex-col items-center justify-end text-center",
          "pb-[10vh]"
        )}
      >
        <div
          className={clsx(
            "home-hero__content",
            "flex flex-col items-center text-center",
            "px-4 select-none"
          )}
          ref={contentRef}
        >
          <p
            className={clsx(
              "home-hero__eyebrow",
              "text-sm sm:text-base text-white/55 mb-4"
            )}
            ref={eyebrowRef}
          >
            I&rsquo;m Aymane &mdash;
          </p>

          <h1
            className={clsx(
              "home-hero__title",
              "font-great-vibes text-white",
              "text-4xl sm:text-6xl md:text-6xl lg:text-7xl xl:text-8xl",
              "leading-tight"
            )}
            ref={headlineRef}
          >
            A quiet maker of <span className="text-peach">Small Universes</span>
          </h1>

          <p
            className={clsx(
              "home-hero__intro",
              "text-white/65 font-light",
              "text-base sm:text-lg md:text-xl",
              "max-w-xl mt-6"
            )}
            ref={subRef}
          >
            I notice light. I&rsquo;ve been drawing since before I could write.
            Now I do it with code.
          </p>

          <div className="mt-8 pointer-events-auto" ref={ctaRef}>
            <Button
              label="To wander"
              variant="outline"
              size="large"
              onClick={handleWander}
            />
          </div>
        </div>
      </section>

      {/* About reveal — slides in from the top over the blurred Saturn once it
          has finished assembling (the end of the journey). */}
      <div
        ref={aboutRevealRef}
        className={clsx(
          "home-about__reveal",
          reduced
            ? "relative z-20 min-h-screen"
            : "absolute inset-0 z-20 opacity-0 pointer-events-none",
          "flex flex-col items-center justify-center text-center",
          "px-6"
        )}
      >
        {/* Section spine — fades in with this block. */}
        <SectionMarker label="THE MAKER" />

        <h2
          ref={aboutTitleRef}
          className={clsx(
            "home-about__title",
            "font-great-vibes text-white",
            "text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-none",
            "mb-8 sm:mb-10"
          )}
        >
          <span>Small,</span> <span>Patient</span>{" "}
          <span className="text-peach">Details</span>
        </h2>

        <div className="max-w-2xl space-y-5 sm:space-y-6">
          <p
            ref={aboutPara1Ref}
            className={clsx(
              "home-about__body",
              "text-white font-light",
              "text-base sm:text-lg md:text-xl leading-relaxed sm:leading-loose"
            )}
          >
            I don&rsquo;t fill rooms &mdash; I notice them. I&rsquo;ve always
            been the quiet one, more at home watching than performing.
            That&rsquo;s where the work comes from: a love of small, patient
            details &mdash; the right easing curve, the soft edge of a shadow,
            the moment a page finally breathes.
          </p>
          <p
            ref={aboutPara2Ref}
            className={clsx(
              "home-about__body",
              "text-white font-light",
              "text-base sm:text-lg md:text-xl leading-relaxed sm:leading-loose"
            )}
          >
            I build the way I drew as a kid: slowly, and for the love of it.
            Only now, other people get to live inside what I make. I care less
            about looking impressive than about being honest &mdash; quiet
            interfaces that feel considered, and a little bit alive.
          </p>
        </div>
      </div>

      {/* The Craft — folded into the journey as an overlay: slides up over the
          built Saturn, its constellation assembles, then it fades out to reveal
          the Saturn for the fly-away. (Relative, in normal flow, for reduced
          motion.) */}
      <Skills overlayRef={craftRef} reduced={reduced} />
    </div>
  );
};

export default Hero;
