"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
import clsx from "clsx";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Skills — "the constellation."
 *
 * Story (07-storyboard-v2): the tools I reach for and the things that pull my
 * eye, connected into an organic web with no fixed shape. Two threads — creative
 * (Photography · Drawing · Motion) and engineering (React · TypeScript · Next.js
 * · GSAP) — meet at a bridge (Three.js / R3F). The section pins and the web
 * assembles as you scroll: nodes pop in, connector lines draw (and unravel if
 * you scroll back up), labels fade in last.
 */

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  /** Label vertical offset from the node (negative = above). */
  labelDy: number;
  bridge?: boolean;
};

// Organic layout (SVG units) — creative thread up top, engineering below, the
// Three.js/R3F bridge in the middle where they meet. No recognizable shape.
const NODES: Node[] = [
  { id: "photo", label: "Photography", x: 110, y: 95, r: 5, labelDy: -14 },
  { id: "draw", label: "Drawing", x: 300, y: 58, r: 5, labelDy: -14 },
  { id: "motion", label: "Motion", x: 488, y: 104, r: 5, labelDy: -14 },
  {
    id: "bridge",
    label: "Three.js / R3F",
    x: 300,
    y: 212,
    r: 9,
    labelDy: 26,
    bridge: true,
  },
  { id: "react", label: "React", x: 104, y: 330, r: 5, labelDy: 22 },
  { id: "ts", label: "TypeScript", x: 250, y: 362, r: 5, labelDy: 22 },
  { id: "next", label: "Next.js", x: 410, y: 348, r: 5, labelDy: 22 },
  { id: "gsap", label: "GSAP", x: 522, y: 298, r: 5, labelDy: 22 },
];

// Connections (node id pairs). Two threads, both wired through the bridge, plus
// one thematic cross-link (GSAP ↔ Motion).
const LINES: [string, string][] = [
  ["photo", "draw"],
  ["draw", "motion"], // creative thread
  ["react", "ts"],
  ["ts", "next"],
  ["next", "gsap"], // engineering thread
  ["bridge", "draw"],
  ["bridge", "motion"], // bridge → creative
  ["bridge", "react"],
  ["bridge", "next"], // bridge → engineering
  ["gsap", "motion"], // motion tool ↔ motion craft
];

type Star = {
  left: number;
  top: number;
  size: number;
  delay: number;
  dur: number;
};

const Skills = () => {
  const containerRef = useRef<HTMLElement | null>(null);

  // Generate the faint starfield on the client only (avoids SSR hydration
  // mismatch from Math.random).
  const [stars, setStars] = useState<Star[]>([]);
  useEffect(() => {
    setStars(
      Array.from({ length: 44 }, () => ({
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() < 0.82 ? 1 : 2,
        delay: Math.random() * 4,
        dur: 3 + Math.random() * 4,
      }))
    );
  }, []);

  const nodeMap = useMemo(
    () =>
      Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, Node>,
    []
  );

  // Pinned, scrubbed assembly. Reversible: scroll down assembles, up unravels.
  useGSAP(
    () => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      if (reduce) return; // leave the web assembled (CSS defaults)

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: 1,
        },
      });

      tl.from(
        [".skills__title", ".skills__intro"],
        { autoAlpha: 0, y: 24, stagger: 0.08, duration: 0.12 },
        0
      )
        .from(
          ".skill-node",
          {
            scale: 0,
            autoAlpha: 0,
            transformOrigin: "center",
            ease: "back.out(2)",
            stagger: 0.05,
            duration: 0.2,
          },
          0.08
        )
        .from(
          ".skill-line",
          { strokeDashoffset: 1, ease: "none", stagger: 0.05, duration: 0.4 },
          0.22
        )
        .from(
          ".skill-label",
          { autoAlpha: 0, y: 6, stagger: 0.04, duration: 0.2 },
          0.55
        );
    },
    { scope: containerRef }
  );

  return (
    <section
      id="skills"
      ref={containerRef}
      className={clsx(
        "home-skills",
        "relative z-10 min-h-screen overflow-hidden bg-rich-black",
        "flex flex-col items-center justify-center px-4 py-20"
      )}
    >
      {/* Faint starfield background */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              opacity: 0.5,
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Title + intro */}
      <h2
        className={clsx(
          "home-skills__title skills__title",
          "font-great-vibes text-white text-center",
          "text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none",
          "relative z-10"
        )}
      >
        What I&rsquo;m <span className="text-peach">drawn to</span>
      </h2>
      <p
        className={clsx(
          "home-skills__intro skills__intro",
          "relative z-10 mt-5 mb-2 max-w-xl text-center",
          "text-white/60 font-light text-base sm:text-lg leading-relaxed"
        )}
      >
        The tools I reach for and the things that pull my eye &mdash; connected,
        because the way I see is the way I build.
      </p>

      {/* The constellation */}
      <svg
        viewBox="0 0 600 420"
        className="relative z-10 w-full max-w-3xl mt-6"
        role="img"
        aria-label="An organic constellation of my tools and creative pulls"
      >
        {/* Connector lines (drawn on scroll via stroke-dashoffset) */}
        <g>
          {LINES.map(([a, b], i) => {
            const A = nodeMap[a];
            const B = nodeMap[b];
            return (
              <line
                key={i}
                className="skill-line"
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke="var(--color-baby-blue)"
                strokeWidth={1}
                strokeOpacity={0.4}
                pathLength={1}
                strokeDasharray={1}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {NODES.map((n) => (
            <g key={n.id}>
              {n.bridge && (
                <circle
                  className="skill-node"
                  cx={n.x}
                  cy={n.y}
                  r={n.r + 9}
                  fill="var(--color-peach)"
                  opacity={0.12}
                  style={{
                    transformBox: "fill-box",
                    transformOrigin: "center",
                  }}
                />
              )}
              <circle
                className="skill-node"
                cx={n.x}
                cy={n.y}
                r={n.r}
                fill="var(--color-peach)"
                style={{ transformBox: "fill-box", transformOrigin: "center" }}
              />
            </g>
          ))}
        </g>

        {/* Labels */}
        <g>
          {NODES.map((n) => (
            <text
              key={n.id}
              className="skill-label"
              x={n.x}
              y={n.y + n.labelDy}
              fill="var(--color-light-baby-blue)"
              fontSize={n.bridge ? 13 : 11.5}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
            >
              {n.label}
            </text>
          ))}
        </g>
      </svg>
    </section>
  );
};

export default Skills;
