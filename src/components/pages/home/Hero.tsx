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
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useSceneIntro } from "#/stores/useSceneIntro";
import { JOURNEY } from "#/components/three.js/star/config";
import { clamp01, remap01 } from "#/components/three.js/star/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// WebGL-only — load on the client, never during SSR. The unified scene holds
// the starfield, the star, AND the Saturn that assembles from its debris.
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
  const canvasWrapRef = useRef<HTMLDivElement | null>(null);
  const aboutRevealRef = useRef<HTMLDivElement | null>(null);

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
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setIntro = useSceneIntro.getState().setProgress;
    if (reduce) {
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

  // One pinned sequence drives the whole journey: the star ignites → zooms →
  // bursts, then Saturn assembles from the debris. The star reads useHeroScroll
  // and Saturn reads useAboutScroll; both are mapped from this single pin's
  // progress (the star keeps its original scroll feel over 0..starSpan; Saturn
  // assembles over assembleStart..1, overlapping the burst). Reduced motion
  // skips the pin entirely (static star, no assembly).
  useGSAP(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      // No journey: just show the About copy (the planet stays hidden).
      gsap.set(aboutRevealRef.current, { autoAlpha: 1, y: 0 });
      return;
    }

    const setStar = useHeroScroll.getState().setProgress;
    const setAbout = useAboutScroll.getState().setProgress;

    // Reveal starts hidden / un-blurred.
    gsap.set(aboutRevealRef.current, { autoAlpha: 0, y: -40 });
    gsap.set(canvasWrapRef.current, { filter: "blur(0px) brightness(1)" });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: JOURNEY.pinLength,
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          const p = self.progress;
          setStar(clamp01(p / JOURNEY.starSpan));
          // Saturn is fully built by assembleEnd; the rest is the reveal.
          setAbout(remap01(p, JOURNEY.assembleStart, JOURNEY.assembleEnd));
        },
      },
    });

    const revealDur = 1 - JOURNEY.revealStart;

    // Hero copy rises and fades out early (the star journey takes over).
    tl.to(
      contentRef.current,
      {
        yPercent: -60,
        autoAlpha: 0,
        ease: "power1.in",
        duration: JOURNEY.contentExit,
      },
      0
    )
      .to(
        logoRef.current,
        { autoAlpha: 0, ease: "power1.in", duration: JOURNEY.contentExit },
        0
      )
      // Spacer so the pin (and the scrubbed progress) spans the whole journey.
      .to({}, { duration: 1 - JOURNEY.contentExit })
      // End reveal — once Saturn is built: blur + dim the cosmos…
      .to(
        canvasWrapRef.current,
        {
          filter: `blur(${JOURNEY.revealBlur}px) brightness(${JOURNEY.revealDim})`,
          ease: "none",
          duration: revealDur,
        },
        JOURNEY.revealStart
      )
      // …and slide the About title + description in from the top.
      .to(
        aboutRevealRef.current,
        {
          autoAlpha: 1,
          y: 0,
          ease: "power2.out",
          duration: revealDur,
        },
        JOURNEY.revealStart
      );

    return () => {
      setStar(0);
      setAbout(0);
    };
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
      <div className="absolute inset-0 z-0 will-change-[filter]" ref={canvasWrapRef}>
        <CosmicScene />
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

      {/* About reveal — slides in from the top over the blurred Saturn once it
          has finished assembling (the end of the journey). */}
      <div
        ref={aboutRevealRef}
        className={clsx(
          "home-about__reveal",
          "absolute inset-0 z-20 opacity-0 pointer-events-none",
          "flex flex-col items-center justify-center text-center",
          "px-6"
        )}
      >
        <h2
          className={clsx(
            "home-about__title",
            "font-great-vibes text-white",
            "text-6xl sm:text-7xl md:text-8xl lg:text-9xl leading-none",
            "mb-8 sm:mb-10"
          )}
        >
          <span className="text-7xl sm:text-8xl md:text-9xl">Beyond</span>{" "}
          <span>The</span> <span className="text-peach">Code</span>
        </h2>

        <div className="max-w-2xl space-y-5 sm:space-y-6">
          <p
            className={clsx(
              "home-about__body",
              "text-white/80 font-light",
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
            className={clsx(
              "home-about__body",
              "text-white/80 font-light",
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
    </div>
  );
};

export default Hero;
