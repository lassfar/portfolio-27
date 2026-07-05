"use client";

import { useRef } from "react";
import dynamic from "next/dynamic";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import clsx from "clsx";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// WebGL-only — load on the client, never during SSR.
const WorldsScene = dynamic(
  () => import("#/components/three.js/worlds/WorldsScene"),
  { ssr: false }
);

/**
 * Photography — "the worlds in orbit."
 *
 * Story (07-storyboard-v2): every photo I've caught is a little world. They
 * orbit the Sun (the surviving core = me). Phase 1: the orbit is fully visible
 * and revolving, with the title/intro. Later passes pin the section and let you
 * scroll to zoom into each world, which dissolves open to reveal a photo.
 */
const Worlds = () => {
  const containerRef = useRef<HTMLElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const introRef = useRef<HTMLParagraphElement | null>(null);

  useGSAP(() => {
    gsap.from([titleRef.current, introRef.current], {
      autoAlpha: 0,
      y: 24,
      stagger: 0.12,
      duration: 1,
      ease: "power2.out",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 70%",
        toggleActions: "play none none reset",
      },
    });
  });

  return (
    <section
      id="worlds"
      ref={containerRef}
      className={clsx(
        "home-worlds",
        "relative z-10 min-h-screen overflow-hidden bg-rich-black"
      )}
    >
      {/* Full-bleed orbit scene */}
      <div className="absolute inset-0 z-0">
        <WorldsScene />
      </div>

      {/* Title + intro, up top so the orbit stays centred below */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 pt-[12vh] pointer-events-none">
        <h2
          ref={titleRef}
          className={clsx(
            "home-worlds__title",
            "font-great-vibes text-white",
            "text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none"
          )}
        >
          Light I&rsquo;ve <span className="text-peach">caught</span>
        </h2>
        <p
          ref={introRef}
          className={clsx(
            "home-worlds__intro",
            "mt-5 max-w-xl text-white/60 font-light",
            "text-base sm:text-lg leading-relaxed"
          )}
        >
          I photograph the sky when I&rsquo;m not coding it. Mostly landscapes
          &mdash; horizons, weather, the few quiet minutes when the light turns
          gold and then blue.
        </p>
      </div>
    </section>
  );
};

export default Worlds;
