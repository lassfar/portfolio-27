"use client";

import { useRef } from "react";
import useTextsWritingMotion from "#/components/hooks/motions/texts/useTextsWritingMotion";
import useTextsTypewriterSequenceMotion from "#/components/hooks/motions/texts/useTextsTypewriterSequenceMotion";
import SunriseLogo from "#/components/assets/pictures/logos/sunrise-logo";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import clsx from "clsx";
import Button from "#/components/UI/buttons/Button";

gsap.registerPlugin(useGSAP);

const Hero = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const heroPanelRef = useRef<HTMLDivElement | null>(null);
  const sunriseShapeRef = useRef<SVGSVGElement | null>(null);

  const mainTitleRef = useRef<HTMLHeadingElement | null>(null);
  const mainTitleRef2 = useRef<HTMLHeadingElement | null>(null);
  const mainTitleRef3 = useRef<HTMLHeadingElement | null>(null);

  const mainIntroRef = useRef<HTMLParagraphElement | null>(null);
  const mainIntroRef2 = useRef<HTMLParagraphElement | null>(null);
  const exploreButtonRef = useRef<HTMLDivElement | null>(null);

  // Titles play as a typewriter sequence: write 1 → erase → write 2 → erase → write 3 (loops).
  useTextsTypewriterSequenceMotion({
    elements: [mainTitleRef, mainTitleRef2, mainTitleRef3],
    hold: 4,
    loop: true,
    writeVars: { color: "var(--color-peach)" },
  });

  // Intro paragraphs type in once.
  useTextsWritingMotion({
    elements: [
      {
        ref: mainIntroRef,
        vars: {
          color: "var(--color-peach)",
          stagger: 0.01,
          duration: 0.5,
          translateX: 20,
        },
      },
      {
        ref: mainIntroRef2,
        vars: {
          color: "var(--color-peach)",
          stagger: 0.01,
          duration: 0.5,
          translateX: 20,
        },
      },
    ],
  });

  // Reveal the logo and Explore button last — they stay hidden (opacity 0)
  // until `delay` elapses, which is timed to land after the intro writing
  // motion finishes, so they fade in at the end of the Hero sequence.
  useGSAP(() => {
    gsap.from([sunriseShapeRef.current, exploreButtonRef.current], {
      opacity: 0,
      duration: 2,
      delay: 3.5,
      ease: "power1.out",
    });
  });

  useGSAP(() => {
    gsap.from(heroPanelRef.current, {
      scale: 0.75,
      opacity: 0.25,
      duration: 3,
      ease: "back.inOut",
    });
  });

  return (
    <div
      className={clsx(
        "home-hero",
        "relative",
        "flex",
        "min-h-screen",
        "py-12 md:py-0",
        "overflow-hidden"
      )}
      ref={containerRef}
    >
      <div
        className={clsx(
          "home-hero__foreground-panel",
          "absolute top-0 left-0 right-0 bottom-0 m-auto rounded-2xl",
          "w-11/12 h-11/12",
          "flex flex-col",
          "bg-dark"
        )}
        ref={heroPanelRef}
      />
      <section
        className={clsx(
          "home-hero__section",
          "relative",
          "w-11/12 m-auto",
          "flex"
        )}
      >
        <div
          className={clsx("home-hero__content", "flex flex-col", "m-auto px-4")}
        >
          <div className="m-auto mb-8 md:mb-14">
            <SunriseLogo
              width={240}
              height={200}
              className="rounded-xl w-40 sm:w-52 md:w-60 h-auto translate-x-6 md:translate-x-10"
              ref={sunriseShapeRef}
            />
          </div>
          <div className={clsx("home-hero__titles", "grid mb-6 md:mb-10")}>
            <h1
              className={clsx(
                "home-hero__title",
                "[grid-area:1/1]",
                "font-great-vibes text-center text-white text-5xl sm:text-6xl md:text-8xl lg:text-9xl 2xl:text-[10rem]"
              )}
              ref={mainTitleRef}
            >
              <span className="text-peach">Crafted</span> Realities
            </h1>
            <h1
              className={clsx(
                "home-hero__title",
                "[grid-area:1/1]",
                "font-great-vibes text-center text-white text-5xl sm:text-6xl md:text-8xl lg:text-9xl 2xl:text-[10rem]"
              )}
              ref={mainTitleRef2}
            >
              <span className="text-peach">Build</span> to Scale
            </h1>
            <h1
              className={clsx(
                "home-hero__title",
                "[grid-area:1/1]",
                "font-great-vibes text-center text-white text-5xl sm:text-6xl md:text-8xl lg:text-9xl 2xl:text-[10rem]"
              )}
              ref={mainTitleRef3}
            >
              <span className="text-peach">Elegant</span> Experiences
            </h1>
          </div>
          <p
            className={clsx(
              "home-hero__intro",
              "text-white text-base sm:text-lg md:text-xl lg:text-2xl font-light text-center"
            )}
            ref={mainIntroRef}
          >
            I’m Aymane, a{" "}
            <span className="text-peach">
              Product-focused Frontend Engineer
            </span>{" "}
            turning ambitious ideas into polished digital products.{" "}
            <br className="hidden lg:inline" />
            From rich user interfaces to enterprise platforms, I craft
            experiences that are intuitive for users
            <br className="hidden lg:inline" /> and scalable for teams that blur
            the line between code and art.
          </p>
          <div className="h-6"></div>
          <p
            className={clsx(
              "home-hero__intro",
              "text-white text-base sm:text-lg md:text-xl lg:text-2xl font-light text-center"
            )}
            ref={mainIntroRef2}
          >
            <span className="text-peach">✦</span> Crafted with an{" "}
            <span className="text-peach">artist’s eye</span> and an{" "}
            <span className="text-peach">engineer’s mindset</span>.
          </p>

          <div className="flex my-8 md:my-10" ref={exploreButtonRef}>
            <Button
              label="Explore"
              variant="outline"
              size="large"
              className="mx-auto"
              state="filled"
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Hero;
