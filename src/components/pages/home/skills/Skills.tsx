"use client";

import { CSSProperties, RefObject, useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import Swash from "#/components/UI/swash/Swash";
import DisplayTitle from "#/components/UI/text/DisplayTitle";
import { TITLE_SWASH } from "#/components/pages/home/swashes";
import { CRAFT } from "#/components/pages/home/story/copy";
import { LINES, NODES, type ConstellationNode } from "./constellation";

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
        // GSAP rounds px values by default: the offset (1 → 0, pathLength 1) would jump
        // from hidden to drawn halfway through instead of drawing along the scroll.
        autoRound: false,
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
      Object.fromEntries(NODES.map((n) => [n.id, n])) as Record<string, ConstellationNode>,
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
            className="home-craft__twinkle absolute rounded-full"
            style={
              {
                left: `${s.left}%`,
                top: `${s.top}%`,
                width: s.size,
                height: s.size,
                background: s.color,
                boxShadow: `0 0 ${s.glow}px ${s.color}`,
                opacity: 0.5,
                "--twinkle-dur": `${s.dur}s`,
                "--twinkle-delay": `${s.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Title + intro */}
      <DisplayTitle
        size="md"
        text={CRAFT.title}
        className={clsx(
          "home-skills__title skills__title text-center",
          // Phones: clear of the story title (left) and the timeline (right).
          "relative z-10 px-8 sm:px-0"
        )}
      />
      {/* Its swash draws in once the title has written in (useCosmicJourney). */}
      <Swash
        {...TITLE_SWASH.craft}
        draw={reduced ? "mount" : "cue"}
        className="relative z-10 mt-1 w-48 sm:w-64 md:w-96 lg:w-120"
      />
      <p
        className={clsx(
          "home-skills__intro skills__intro",
          "relative z-10 mt-5 mb-2 max-w-xl px-8 text-center sm:px-0",
          "text-white/60 font-light text-base sm:text-lg leading-relaxed"
        )}
      >
        {CRAFT.intro}
      </p>

      {/* The constellation */}
      <svg
        viewBox="0 0 600 420"
        className="relative z-10 w-full max-w-3xl mt-6"
        role="img"
        aria-label={CRAFT.constellationLabel}
      >
        {/* Connector lines (drawn on scroll via stroke-dashoffset) */}
        <g>
          {LINES.map(([a, b], i) => {
            const A = nodeMap[a];
            const B = nodeMap[b];
            return (
              <line
                key={i}
                // Colour-changing extensions (Dark Reader, …) rewrite stroke/fill
                // into inline styles pre-hydration → per-element mismatch. This is
                // React's escape hatch for that; it does not mask real mismatches.
                suppressHydrationWarning
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
                  suppressHydrationWarning
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
                suppressHydrationWarning
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
              suppressHydrationWarning
              className={clsx(
                "skill-label",
                n.labelDy > 0 && "skill-label--below",
                n.bridge && "skill-label--bridge",
              )}
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
