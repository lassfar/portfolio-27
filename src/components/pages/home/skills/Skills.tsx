"use client";

import { RefObject, useEffect, useMemo, useState } from "react";
import gsap from "gsap";
import clsx from "clsx";
import SectionMarker from "#/components/UI/SectionMarker";

/**
 * Skills — "The Craft" constellation, now an OVERLAY inside the shared cosmic
 * journey (no longer a standalone pinned section).
 *
 * Story (07-storyboard-v2): the tools I reach for and the things that pull my
 * eye, connected into an organic web with no fixed shape. Two threads — creative
 * (Photography · Drawing · Motion) and engineering (React · TypeScript · Next.js
 * · GSAP) — meet at a bridge (Three.js / R3F).
 *
 * It's driven entirely by the master pinned journey (`useCosmicJourney`): the
 * overlay slides up over the built Saturn (its opaque bg covering the planet),
 * the web assembles as you scroll (`addConstellationAssembly`, below), then the
 * whole overlay fades out to reveal the Saturn again for its fly-away. This
 * component is purely presentational — it renders the markup + faint starfield
 * and exposes its root via `overlayRef`.
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
  color: string;
  glow: number;
  delay: number;
  dur: number;
};

// Realistic-neutral stellar tints (weighted toward white), matching the R3F
// cosmic starfield so the whole portfolio's space feels consistent.
const STAR_TINTS = ["#cfe0ff", "#ffffff", "#ffffff", "#fff4e6", "#ffe6c2"];

/**
 * Adds the constellation's assembly to the master journey timeline, scrubbed
 * over the pin window [`at`, `at` + `duration`] (both in master-progress units,
 * 0..1). Reversible: scroll down assembles, up unravels. Same tween shapes as
 * the old standalone pin, re-timed into the window (durations/staggers scaled by
 * `duration`) so it stays in lockstep with the rest of the journey.
 */
export function addConstellationAssembly(
  tl: gsap.core.Timeline,
  { at, duration }: { at: number; duration: number }
): void {
  const T = (f: number) => at + duration * f; // absolute position in the window
  const D = (f: number) => duration * f; // a fraction of the window as a duration

  tl.from(".skills__intro", { autoAlpha: 0, y: 24, duration: D(0.16) }, T(0))
    .from(
      ".skill-node",
      {
        scale: 0,
        autoAlpha: 0,
        transformOrigin: "center",
        ease: "back.out(2)",
        stagger: D(0.05),
        duration: D(0.27),
      },
      T(0.1)
    )
    .from(
      ".skill-line",
      {
        strokeDashoffset: 1,
        ease: "none",
        stagger: D(0.05),
        duration: D(0.53),
      },
      T(0.29)
    )
    .from(
      ".skill-label",
      { autoAlpha: 0, y: 6, stagger: D(0.04), duration: D(0.27) },
      T(0.73)
    );
}

type Props = {
  /** The overlay root — driven (slide up + fade out) by the master journey. */
  overlayRef: RefObject<HTMLDivElement | null>;
  /** Reduced motion: lay out in normal flow instead of an absolute overlay. */
  reduced?: boolean;
};

const Skills = ({ overlayRef, reduced = false }: Props) => {
  // Generate the faint starfield on the client only (avoids SSR hydration
  // mismatch from Math.random).
  const [stars, setStars] = useState<Star[]>([]);
  useEffect(() => {
    setStars(
      Array.from({ length: 60 }, () => {
        const bright = Math.random() < 0.16;
        const size = bright
          ? 2 + Math.random() * 1.5
          : Math.random() < 0.7
            ? 1
            : 1.5;
        return {
          left: Math.random() * 100,
          top: Math.random() * 100,
          size,
          color: STAR_TINTS[Math.floor(Math.random() * STAR_TINTS.length)],
          glow: bright ? size * 3 : size * 1.5,
          delay: Math.random() * 4,
          dur: 3 + Math.random() * 4,
        };
      })
    );
  }, []);

  const nodeMap = useMemo(
    () =>
      Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, Node>,
    []
  );

  return (
    <div
      id="skills"
      ref={overlayRef}
      className={clsx(
        "home-skills home-craft",
        // An opaque overlay that slides up OVER the built Saturn, then fades out
        // to reveal it again — both driven by the master journey (renderCraft).
        // Starts parked below the fold; the journey sets transform/opacity.
        reduced
          ? "relative z-30 min-h-screen"
          : "absolute inset-0 z-30 pointer-events-none will-change-[transform,opacity]",
        "overflow-hidden bg-rich-black",
        "flex flex-col items-center justify-center px-4 py-20"
      )}
      style={reduced ? undefined : { transform: "translateY(100%)" }}
    >
      {/* Faint starfield background */}
      <div className="absolute inset-0 pointer-events-none">
        {stars.map((s, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              background: s.color,
              boxShadow: `0 0 ${s.glow}px ${s.color}`,
              opacity: 0.5,
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Section spine */}
      <SectionMarker label="THE CRAFT" />

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
    </div>
  );
};

export default Skills;
