"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import SunriseLogo from "#/components/assets/pictures/logos/sunrise-logo";
import Button from "#/components/UI/buttons/Button";
import Skills from "#/components/pages/home/skills/Skills";
import Contact from "#/components/pages/home/contact/Contact";
import clsx from "clsx";
import Swash from "#/components/UI/swash/Swash";
import DisplayTitle from "#/components/UI/text/DisplayTitle";
import { TITLE_SWASH } from "#/components/pages/home/swashes";
import { ABOUT, HERO } from "#/components/pages/home/story/copy";
import { useLoaded } from "#/components/hooks/useLoaded";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { loadScene } from "#/components/three.js/scene/preload";
import { useGateLive } from "#/components/pages/home/motion/gateLive";

// WebGL-only — load on the client, never during SSR. The unified scene holds
// the starfield, the star, the Saturn that assembles from its debris, and (as
// the journey continues) the Saturn's fly-away out into the wider voyage.
// The canvas mounts once the journey is live (ModeGate, P27-93); its code is fetched as the
// page loads with motion on (loadJourney), else only before a switch to motion.
const CosmicScene = dynamic(loadScene, { ssr: false });

const Hero = () => {
  const live = useGateLive();
  // The headline writing in, the intro around it and the whole journey (HeroMotion): the
  // journey's motion code (P27-95), fetched apart so the calm mode never loads it.
  const journey = useLoaded(loadJourneyMotion, live);
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
  const craftRef = useRef<HTMLDivElement | null>(null);
  const contactRef = useRef<HTMLDivElement | null>(null);

  // "To wander": glide to The Maker (P27-91), the star bursting and Saturn forming on the
  // way, onto the About text.
  const handleWander = () =>
    void loadJourneyMotion()
      .then((journey) => journey.goTo("maker", { by: "hero" }))
      .catch(() => undefined);

  return (
    <>
      <div
        className={clsx("home-hero", "relative min-h-screen overflow-hidden", "bg-rich-black")}
        ref={containerRef}
      >
        {/* Full-bleed unified cosmos (starfield + star + Saturn), behind content.
          Blurred + dimmed at the end of the journey for the About reveal. */}
        <div className="home-hero__canvas absolute inset-0 z-0">{live && <CosmicScene />}</div>

        {/* Logo, top-left */}
        <div className="pointer-events-auto absolute top-6 left-6 z-10" ref={logoRef}>
          <SunriseLogo width={56} height={48} className="h-auto w-10 sm:w-12" />
        </div>

        {/* Content overlay — pointer-events-none so drags reach the space;
          interactive children re-enable pointer events. */}
        <section
          className={clsx(
            "home-hero__section",
            "pointer-events-none relative z-10",
            "mx-auto min-h-screen w-11/12",
            "flex flex-col items-center justify-end text-center",
            "pb-[10vh]",
          )}
        >
          <div
            className={clsx(
              "home-hero__content",
              "flex flex-col items-center text-center",
              "px-4 select-none",
            )}
            ref={contentRef}
          >
            <p
              className={clsx("home-hero__eyebrow", "mb-4 text-sm text-white/55 sm:text-base")}
              ref={eyebrowRef}
            >
              {HERO.eyebrow}
            </p>

            <DisplayTitle
              ref={headlineRef}
              as="h1"
              size="hero"
              text={HERO.headline}
              className="home-hero__title"
            />

            <p
              className={clsx(
                "home-hero__intro",
                "font-light text-white/65",
                "text-base sm:text-lg md:text-xl",
                "mt-6 max-w-xl",
              )}
              ref={subRef}
            >
              {HERO.intro}
            </p>

            <div className="pointer-events-auto mt-8" ref={ctaRef}>
              <Button label={HERO.cta} variant="outline" size="large" onClick={handleWander} />
            </div>
          </div>
        </section>

        {/* About reveal — slides in from the top over the blurred Saturn once it
          has finished assembling (the end of the journey). */}
        <div
          ref={aboutRevealRef}
          className={clsx(
            "home-about__reveal",
            "pointer-events-none absolute inset-0 z-20 opacity-0",
            "flex flex-col items-center justify-center text-center",
            // Phones: clear of the story title (left) and the timeline (right).
            "px-12 sm:px-6",
          )}
        >
          <DisplayTitle
            ref={aboutTitleRef}
            size="xl"
            text={ABOUT.title}
            className="home-about__title mb-1"
          />
          {/* Its swash draws in once the title has written in (useCosmicJourney). */}
          <Swash
            {...TITLE_SWASH.maker}
            draw="cue"
            className="mb-7 w-56 sm:mb-9 sm:w-72 md:w-110 lg:w-150"
          />

          <div className="max-w-2xl space-y-5 sm:space-y-6">
            <p
              ref={aboutPara1Ref}
              className={clsx(
                "home-about__body",
                "font-light text-white",
                "text-base leading-relaxed sm:text-lg sm:leading-loose md:text-xl",
              )}
            >
              {ABOUT.paragraphs[0]}
            </p>
            <p
              ref={aboutPara2Ref}
              className={clsx(
                "home-about__body",
                "font-light text-white",
                "text-base leading-relaxed sm:text-lg sm:leading-loose md:text-xl",
              )}
            >
              {ABOUT.paragraphs[1]}
            </p>
          </div>
        </div>

        {/* The Craft — folded into the journey as an overlay: slides up over the
          built Saturn, its constellation assembles, then it fades out to reveal
          the Saturn for the fly-away. */}
        <Skills overlayRef={craftRef} />

        {/* Contact — the last beat: fades in over the blurred, dimmed galaxy once it
          has fully resolved (and a short pause on it). */}
        <Contact overlayRef={contactRef} />
      </div>
      {/* After the root, not in it: by then its ref (the pin's trigger) is set too. */}
      {live && journey && (
        <journey.HeroMotion
          containerRef={containerRef}
          logoRef={logoRef}
          eyebrowRef={eyebrowRef}
          headlineRef={headlineRef}
          subRef={subRef}
          ctaRef={ctaRef}
          contentRef={contentRef}
          aboutRevealRef={aboutRevealRef}
          aboutTitleRef={aboutTitleRef}
          aboutPara1Ref={aboutPara1Ref}
          aboutPara2Ref={aboutPara2Ref}
          craftRef={craftRef}
          contactRef={contactRef}
        />
      )}
    </>
  );
};

export default Hero;
