"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import SunriseLogo from "#/components/assets/pictures/logos/sunrise-logo";
import Button from "#/components/UI/buttons/Button";
import Skills from "#/components/pages/home/skills/Skills";
import Contact from "#/components/pages/home/contact/Contact";
import ChapterTexts from "#/components/pages/home/ChapterTexts";
import { JOURNEY_CONTACT_TITLE_ID } from "#/components/pages/home/contact/config";
import clsx from "clsx";
import Swash from "#/components/UI/swash/Swash";
import DisplayTitle from "#/components/UI/text/DisplayTitle";
import { TITLE_SWASH } from "#/components/pages/home/swashes";
import { ABOUT, CHAPTER_NAMES, HERO } from "#/components/pages/home/story/copy";
import { useLoaded } from "#/components/hooks/useLoaded";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { loadScene } from "#/components/three.js/scene/preload";
import { useGateLive } from "#/components/pages/home/motion/gateLive";
import { STAR_VIEW } from "#/components/pages/home/phase-nav/config";

// WebGL-only — load on the client, never during SSR. The unified scene holds
// the starfield, the star, the Saturn that assembles from its debris, and (as
// the journey continues) the Saturn's fly-away out into the wider voyage.
// The canvas mounts once the journey is live (ModeGate, P27-93); its code is fetched as the
// page loads with motion on (loadJourney), else once the pointer or focus lingers on the
// Reduce motion switch (MotionSwitch), or at the switch to motion.
const CosmicScene = dynamic(loadScene, { ssr: false });

/** How long "To wander" waits for the journey to be in place (ms), as the skip link does. */
const WANDER_READY_MS = 3000;

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

  // "To wander": glide to the star, centred just before it bursts (STAR_VIEW, P27-108: the
  // user); from there the assistant offers The Maker. A click before the journey's pin exists
  // (just after load) waits for it, as the skip link does: the glide would otherwise do nothing.
  const handleWander = () =>
    void loadJourneyMotion()
      .then(async (journey) => {
        if (await journey.waitForJourney(WANDER_READY_MS)) journey.glideTo(STAR_VIEW, "hero");
      })
      .catch(() => undefined);

  return (
    <>
      <div
        className={clsx("home-hero", "relative h-screen overflow-clip", "bg-rich-black")}
        ref={containerRef}
      >
        {/* Full-bleed unified cosmos (starfield + star + Saturn), behind content.
          Blurred + dimmed at the end of the journey for the About reveal. */}
        <div className="home-hero__canvas absolute inset-0 z-0" aria-hidden="true">
          {live && <CosmicScene />}
        </div>

        {/* Logo, top-left */}
        <div
          className="pointer-events-auto absolute top-6 left-6 z-10"
          ref={logoRef}
          aria-hidden="true"
        >
          <SunriseLogo width={56} height={48} className="h-auto w-10 sm:w-12" />
        </div>

        {/* Content overlay — pointer-events-none so drags reach the space;
          interactive children re-enable pointer events. Taller than the screen (zoom 400%), it
          tightens (`data-tight`, `tight:`: the journey measures it, P27-101). */}
        <section
          className={clsx(
            "home-hero__section",
            "pointer-events-none relative z-10",
            "mx-auto min-h-screen w-11/12",
            "flex flex-col items-center justify-end text-center",
            "pb-[10vh] data-tight:pb-3",
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
              className={clsx(
                "home-hero__eyebrow",
                "mb-4 text-sm text-white/55 sm:text-base tight:mb-1.5",
              )}
              ref={eyebrowRef}
            >
              {HERO.eyebrow}
            </p>

            <DisplayTitle
              ref={headlineRef}
              as="h1"
              size="hero"
              text={HERO.headline}
              className="home-hero__title tight:text-3xl sm:tight:text-5xl"
            />

            <p
              className={clsx(
                "home-hero__intro",
                "font-light text-white/65",
                "text-base sm:text-lg md:text-xl tight:text-sm sm:tight:text-base",
                "mt-6 max-w-xl tight:mt-3",
              )}
              ref={subRef}
            >
              {HERO.intro}
            </p>

            <div className="pointer-events-auto mt-8 tight:mt-4" ref={ctaRef}>
              <Button label={HERO.cta} variant="outline" size="large" onClick={handleWander} />
            </div>
          </div>
        </section>

        {/* What the 3D shows next, in words for screen readers: the star, its burst, Saturn. */}
        <ChapterTexts chapters={["origin"]} />

        {/* About reveal — slides in from the top over the blurred Saturn once it
          has finished assembling (the end of the journey). On a short screen its text follows
          the scroll as its words write in (P27-101): centred while it fits (the auto margins),
          from its top when it doesn't. */}
        <div
          ref={aboutRevealRef}
          data-overlay-scroll
          className={clsx(
            "home-about__reveal",
            "pointer-events-none absolute inset-0 z-20 opacity-0",
            "flex flex-col items-center overflow-hidden text-center",
            // Its box ends above the orb (shown all through About) wherever it doesn't fit with the
            // orb's room below it (`data-overflows`, measured with that room: useCosmicJourney), so
            // no line is ever under it (P27-102, `above-orb`). Its padding: the last words rise in
            // (from 24 px lower) inside it, and the title's flourishes clear its top. Where that
            // doesn't all fit, it scrolls a little as it writes in (a 1280×640 window: 22 px).
            "data-overflows:above-orb data-overflows:py-6",
            // Phones: clear of the story title (left) and the timeline (right). A short screen
            // under 832 px wide: clear of the motion switch too, as its lines pass the top.
            "px-12 sm:px-6 short:max-[52rem]:px-18",
          )}
        >
          <DisplayTitle
            ref={aboutTitleRef}
            size="xl"
            text={ABOUT.title}
            srPrefix={`${CHAPTER_NAMES.maker}: `}
            // On a short screen from 832 px wide its one line would reach under the switch: kept
            // in the same clear column (P27-102).
            className="home-about__title mt-auto mb-1 short:min-[52rem]:max-w-[calc(100%-6rem)]"
          />
          {/* Its swash draws in once the title has written in (useCosmicJourney). */}
          <Swash
            {...TITLE_SWASH.maker}
            draw="cue"
            className="mb-7 w-56 sm:mb-9 sm:w-72 md:w-110 lg:w-150 short:mb-3"
          />

          {/* Its words for screen readers: the paragraphs below write in word by word (split,
              so hidden from them), and are read from here instead, once (P27-100). */}
          <div className="sr-only">
            {ABOUT.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div
            className="mb-auto max-w-2xl space-y-5 sm:space-y-6 short:space-y-3"
            aria-hidden="true"
          >
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

        {/* The Maker's own line and its bridge to the Craft, for screen readers. */}
        <ChapterTexts chapters={["maker"]} />

        {/* The Craft — folded into the journey as an overlay: slides up over the
          built Saturn, its constellation assembles, then it fades out to reveal
          the Saturn for the fly-away. */}
        <Skills overlayRef={craftRef} />

        {/* The Craft (its overlay only shows in its stretch) and the chapters the 3D tells alone,
            in words for screen readers (P27-100). */}
        <ChapterTexts
          chapters={["craft", "voyage", "earth", "lab", "way-out", "milky-way"]}
          labels
        />

        {/* Contact — the last beat: fades in over the blurred, dimmed galaxy once it
          has fully resolved (and a short pause on it). */}
        <Contact overlayRef={contactRef} titleId={JOURNEY_CONTACT_TITLE_ID} />
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
