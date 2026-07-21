"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import useTextsWritingMotion from "#/components/hooks/motions/texts/useTextsWritingMotion";
import { addTextsScrollWriteIn } from "#/components/hooks/motions/texts/textsScrollWriteInMotion";
import SunriseLogo from "#/components/assets/pictures/logos/sunrise-logo";
import SectionMarker from "#/components/UI/SectionMarker";
import Button from "#/components/UI/buttons/Button";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger, SplitText } from "gsap/all";
import clsx from "clsx";
import { useHeroScroll } from "#/stores/useHeroScroll";
import { useAboutScroll } from "#/stores/useAboutScroll";
import { useSceneIntro } from "#/stores/useSceneIntro";
import { JOURNEY } from "#/components/three.js/star/config";
import { clamp01, remap01 } from "#/components/three.js/star/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);

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
  const aboutTitleRef = useRef<HTMLHeadingElement | null>(null);
  const aboutPara1Ref = useRef<HTMLParagraphElement | null>(null);
  const aboutPara2Ref = useRef<HTMLParagraphElement | null>(null);
  const heroMarkerRef = useRef<HTMLDivElement | null>(null);

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

    // The About block + cosmos are driven deterministically from the scroll
    // progress (a pure function, set every frame), so the reveal and exit
    // reverse perfectly on scroll-up — no tween start-value recording or
    // autoAlpha visibility snapping (the source of the scrub-up glitches).
    const easeIn = gsap.parseEase("power2.in");
    const easeOut = gsap.parseEase("power2.out");

    const renderAbout = (p: number) => {
      const enterLin = remap01(p, JOURNEY.revealStart, JOURNEY.fillStart);
      const exitLin = remap01(p, JOURNEY.exitStart, 1);
      const enter = easeOut(enterLin);
      const exit = easeIn(exitLin);

      // Block: fades in on the reveal, out on the exit; slides -40 → 0 → -80;
      // blurs only as it exits.
      const block = aboutRevealRef.current;
      if (block) {
        block.style.opacity = String(enter * (1 - exit));
        block.style.transform = `translateY(${-40 * (1 - enter) - 80 * exit}px)`;
        block.style.filter = `blur(${16 * exit}px)`;
      }

      // Cosmos: blurs + dims in over the reveal, un-blurs back over the exit.
      const cosmos = canvasWrapRef.current;
      if (cosmos) {
        const k = enterLin * (1 - exitLin);
        cosmos.style.filter = `blur(${JOURNEY.revealBlur * k}px) brightness(${
          1 - (1 - JOURNEY.revealDim) * k
        })`;
      }
    };
    renderAbout(0); // start hidden / un-blurred

    // About title: a one-shot per-character write-in (the Hero motion) that plays
    // when the reveal appears — NOT scrubbed. Toggled from the journey progress
    // below (plays past revealStart, reverses back above it).
    const titleSplit = aboutTitleRef.current
      ? new SplitText(aboutTitleRef.current, { type: "words,chars" })
      : null;
    const titleWriteIn = titleSplit
      ? gsap.from(titleSplit.chars, {
          opacity: 0,
          y: 24,
          stagger: 0.03,
          duration: 0.6,
          ease: "power3.out",
          paused: true,
        })
      : null;
    let titleShown = false;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: JOURNEY.pinLength,
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          // Journey progress: the star→Saturn→About journey plays over
          // 0..journeyEnd of the pin; the tail (journeyEnd..1) is the Craft
          // slide-over, during which the Saturn just stays pinned/fixed.
          const jp = clamp01(self.progress / JOURNEY.journeyEnd);
          setStar(clamp01(jp / JOURNEY.starSpan));
          // Saturn is fully built by assembleEnd; the rest is the reveal/exit.
          setAbout(remap01(jp, JOURNEY.assembleStart, JOURNEY.assembleEnd));
          renderAbout(jp);
          // Play the title write-in once when the reveal appears; reverse it if
          // the reader scrubs back up above the reveal.
          if (titleWriteIn) {
            if (jp >= JOURNEY.revealStart && !titleShown) {
              titleShown = true;
              titleWriteIn.play();
            } else if (jp < JOURNEY.revealStart && titleShown) {
              titleShown = false;
              titleWriteIn.reverse();
            }
          }
        },
      },
    });

    // The timeline scrubs over the WHOLE pin (0..1), but the journey lives in
    // 0..journeyEnd — so its tl positions are scaled by journeyEnd to stay in
    // lockstep with the jp-driven reveal above.
    const JE = JOURNEY.journeyEnd;
    const contentExit = JOURNEY.contentExit * JE;

    // Hero copy rises and fades out early (the star journey takes over).
    tl.to(
      contentRef.current,
      { yPercent: -60, autoAlpha: 0, ease: "power1.in", duration: contentExit },
      0
    )
      .to(
        logoRef.current,
        { autoAlpha: 0, ease: "power1.in", duration: contentExit },
        0
      )
      // The Hero "ORIGIN" spine fades out with the copy.
      .to(
        heroMarkerRef.current,
        { autoAlpha: 0, ease: "power1.in", duration: contentExit },
        0
      )
      // Spacer so the pin (and the scrubbed progress) spans the whole pin.
      .to({}, { duration: 1 - contentExit });

    // About description — scroll-scrubbed write-in (the SAME rise-in as the big
    // titles, per word) added straight onto the journey so it scrubs in lockstep
    // over fillStart..exitStart. The title above plays its write-in once instead.
    const descSplits = addTextsScrollWriteIn(
      tl,
      [
        { ref: aboutPara1Ref, type: "words", weight: 1 },
        { ref: aboutPara2Ref, type: "words", weight: 1 },
      ],
      {
        at: JOURNEY.fillStart * JE,
        duration: (JOURNEY.exitStart - JOURNEY.fillStart) * JE,
      }
    );

    return () => {
      setStar(0);
      setAbout(0);
      descSplits.forEach((s) => s.revert());
      titleWriteIn?.kill();
      titleSplit?.revert();
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
          "absolute inset-0 z-20 opacity-0 pointer-events-none",
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
    </div>
  );
};

export default Hero;
