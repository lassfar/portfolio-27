"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import useTextsWritingMotion from "#/components/hooks/motions/texts/useTextsWritingMotion";
import SunriseLogo from "#/components/assets/pictures/logos/sunrise-logo";
import Button from "#/components/UI/buttons/Button";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import clsx from "clsx";
import { useHeroScroll } from "#/stores/useHeroScroll";
import { HERO_SCROLL } from "#/components/three.js/star/config";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// WebGL-only — load on the client, never during SSR.
const StarScene = dynamic(
  () => import("#/components/three.js/star/StarScene"),
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
  });

  // Pinned scroll sequence: hold the hero, lift + fade the content, then drive
  // the star's grow/center/fly-in zoom (in R3F) via the shared scroll store,
  // before releasing to About. Skipped for reduced motion.
  useGSAP(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const setProgress = useHeroScroll.getState().setProgress;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        // Longer pin → the star gets real scroll distance to travel to center,
        // hold there, and then burst. Tuned in config.HERO_SCROLL.
        end: HERO_SCROLL.pinLength,
        pin: true,
        scrub: 1,
        onUpdate: (self) => setProgress(self.progress),
      },
    });

    // Phase 1 — content rises and fades out early (the star journey takes over).
    tl.to(
      contentRef.current,
      {
        yPercent: -60,
        autoAlpha: 0,
        ease: "power1.in",
        duration: HERO_SCROLL.contentExit,
      },
      0
    )
      .to(
        logoRef.current,
        { autoAlpha: 0, ease: "power1.in", duration: HERO_SCROLL.contentExit },
        0
      )
      // Spacer so the pin (and the scrubbed progress) extends through the zoom.
      .to({}, { duration: 0.8 });

    return () => {
      setProgress(0);
    };
  });

  // Smooth-scroll to the About section, via ScrollSmoother when present.
  const handleWander = () => {
    const smoother = ScrollSmoother.get();
    if (smoother) {
      smoother.scrollTo("#about", true, "top top");
    } else {
      document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" });
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
      {/* Full-bleed, draggable space + star, behind the content */}
      <div className="absolute inset-0 z-0">
        <StarScene />
      </div>

      {/* Logo, top-left */}
      <div
        className="absolute top-6 left-6 z-10 pointer-events-auto"
        ref={logoRef}
      >
        <SunriseLogo width={56} height={48} className="w-10 sm:w-12 h-auto" />
      </div>

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
    </div>
  );
};

export default Hero;
