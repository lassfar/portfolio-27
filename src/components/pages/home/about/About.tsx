"use client";

import { useRef } from "react";
import useTextsWritingMotion from "#/components/hooks/motions/texts/useTextsWritingMotion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import HalfSunShape from "#/components/assets/pictures/shapes/half-sun-shape";
import { ScrollTrigger } from "gsap/all";
import clsx from "clsx";

gsap.registerPlugin(useGSAP);
gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const halfSunRef = useRef<HTMLDivElement | null>(null);
  const halfSunShineRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLParagraphElement | null>(null);
  const fullNameSunRef = useRef<HTMLParagraphElement | null>(null);

  useTextsWritingMotion({
    elements: [
      {
        ref: titleRef,
        vars: {
          color: "var(--color-peach)",
          duration: 0.75,
          delay: 0.25,
        },
      },
    ],
  });

  useGSAP(() => {
    gsap.fromTo(
      fullNameSunRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        scrollTrigger: {
          trigger: fullNameSunRef.current,
          start: "top center",
          scrub: true,
        },
      }
    );

    gsap.fromTo(
      halfSunRef.current,
      { scale: 0 },
      {
        scale: 1,
        duration: 3,
        ease: "power1.out",
        scrollTrigger: {
          trigger: titleRef.current,
          toggleActions: "play none none reset",
        },
      }
    );

    gsap.fromTo(
      halfSunShineRef.current,
      { scale: 0 },
      {
        scale: 3,
        duration: 1,
        ease: "power1.out",
        scrollTrigger: {
          trigger: titleRef.current,
          toggleActions: "play none none reset",
        },
      }
    );

    gsap.fromTo(
      titleRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 2,
        ease: "power1.out",
        scrollTrigger: {
          trigger: titleRef.current,
          toggleActions: "play none none reset",
        },
      }
    );
  });

  return (
    <section className="flex relative h-screen" ref={containerRef}>
      <div
        className="relative flex flex-col items-center flex-1"
        ref={contentRef}
      >
        <div className="flex flex-col h-1/2 items-center relative">
          <HalfSunShape
            className="absolute h-48 w-96 origin-bottom bottom-0 z-10"
            ref={halfSunRef}
            data-lag="2"
            data-speed="1.5"
          />
          <HalfSunShape
            className="absolute opacity-35 h-[5vw] w-[10vw] bottom-0 origin-bottom mx-auto z-10"
            ref={halfSunShineRef}
            data-lag="2"
            data-speed="1.5"
          />
        </div>

        <div className="h-1 w-1/3 bg-peach mt-4 mb-8"></div>

        <div>
          <h2
            className={clsx(
              "home-about__title",
              "font-great-vibes text-center text-white text-6xl md:text-8xl lg:text-9xl leading-0",
              "mb-10 z-20 h-1/2"
            )}
            ref={titleRef}
          >
            <span className="text-9xl">Beyond</span> <span>The</span>{" "}
            <span className="text-peach">Code</span>
          </h2>
        </div>
      </div>
    </section>
  );
};

export default About;
