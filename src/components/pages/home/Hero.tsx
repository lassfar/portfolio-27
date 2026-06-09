"use client";

import { useRef } from "react";
import useTextsWritingMotion from "#/components/hooks/motions/texts/useTextsWritingMotion";
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
  const mainIntroRef = useRef<HTMLParagraphElement | null>(null);

  useTextsWritingMotion({
    elements: [
      {
        ref: mainTitleRef,
        vars: {
          color: "var(--color-peach)",
          duration: 0.75,
          delay: 0.25,
        },
      },
      {
        ref: mainIntroRef,
        vars: {
          color: "var(--color-peach)",
          stagger: 0.01,
          duration: 0.5,
          translateX: 20,
        },
      },
    ],
  });

  useGSAP(() => {
    gsap.from(sunriseShapeRef.current, {
      opacity: 0,
      duration: 4,
      ease: "power4.inOut",
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
        "h-screen",
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
      ></div>
      <section
        className={clsx(
          "home-hero__section",
          "relative",
          "w-11/12 m-auto",
          "flex"
        )}
      >
        <div className={clsx("home-hero__content", "flex flex-col", "m-auto")}>
          <div className="m-auto mb-14">
            <SunriseLogo
              width={240}
              height={200}
              className="rounded-xl translate-x-10"
              ref={sunriseShapeRef}
            />
          </div>
          <h1
            className={clsx(
              "home-hero__title",
              "font-great-vibes text-center text-white text-6xl md:text-8xl lg:text-9xl 2xl:text-[10rem]",
              "mb-10"
            )}
            ref={mainTitleRef}
          >
            <span className="text-peach">Crafted</span> Realities
          </h1>
          <p
            className={clsx(
              "home-hero__intro",
              "text-white text-3xl font-light text-center"
            )}
            ref={mainIntroRef}
          >
            Seven years of frontend mastery — now rising to craft experiences
            <br />
            that blur the line between code and art.
          </p>

          <div className="flex my-10">
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
