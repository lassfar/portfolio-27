"use client";

import clsx from "clsx";
import { createPortal } from "react-dom";
import AccentText from "#/components/UI/text/AccentText";
import { useIsClient } from "#/components/hooks/useIsClient";
import { EYEBROW } from "#/components/pages/home/book/layout";
import { SKY, skyOf, starPath } from "#/components/pages/home/motion/sky";
import { SWITCH } from "#/components/pages/home/story/copy";
import type { ChapterId } from "#/components/pages/home/story/story.types";
import type { MotionChoice } from "#/stores/motionPreference";

type Props = {
  /** Shown (it fades in as it mounts), or fading out. */
  shown: boolean;
  /** The mode it switches to. */
  to: MotionChoice;
  /** Where the visitor lands: a chapter of the story (a passage too). */
  place: ChapterId;
  /** The 3D is taking its time: it says so. */
  slow?: boolean;
};

/**
 * The transition screen between the modes (P27-94), "Where you are" (agreed in the sketch
 * docs/design/mockups/13-mode-transition.html): it covers the page while the other mode
 * mounts behind it, and shows where the visitor will land, as a constellation of that mode's
 * chapters, the landing one lit and named, with a line in Aymane's voice.
 *
 * Into calm, only its opacity changes (WCAG 2.3.3). Back to motion, the links up to the
 * landing star draw in, once, as the page turns to motion behind it (`moving:`). The stars
 * are decorative; the words say it all, the landing chapter's name included.
 */
const ModeVeil = ({ shown, to, place, slow = false }: Props) => {
  const client = useIsClient();
  if (!client) return null;
  const sky = skyOf(to, place);
  const drawIn = to === "full";
  const here = sky.points[sky.here];

  return createPortal(
    <div
      data-mode-veil
      className={clsx(
        "fixed inset-0 z-65 grid place-items-center bg-rich-black px-6",
        "transition-[opacity,visibility] ease-out starting:opacity-0",
        shown ? "visible opacity-100" : "invisible opacity-0",
        shown && to === "full" ? "duration-400" : "duration-500",
      )}
    >
      <div className="flex flex-col items-center gap-4.5 text-center">
        <svg
          viewBox={`0 0 ${SKY.width} ${SKY.height}`}
          aria-hidden="true"
          className="h-auto w-[min(640px,86vw)] overflow-visible"
        >
          {sky.points.slice(1, sky.here + 1).map((p, i) => (
            <path
              key={i}
              d={`M${sky.points[i].x} ${sky.points[i].y} L${p.x} ${p.y}`}
              pathLength={1}
              strokeWidth={1.2}
              className={clsx(
                "fill-none stroke-peach/55 [stroke-linecap:round]",
                drawIn &&
                  "[stroke-dasharray:1] [stroke-dashoffset:1] moving:animate-[veil-draw_260ms_ease-out_both]",
              )}
              style={drawIn ? { animationDelay: `${i * 120}ms` } : undefined}
            />
          ))}
          {sky.points.map((p, i) => (
            <path
              key={i}
              d={starPath(p.x, p.y, i === sky.here ? 11 : 6)}
              className={clsx(
                i < sky.here && "fill-peach/80",
                i === sky.here && "fill-peach drop-shadow-[0_0_8px_rgba(255,161,74,0.8)]",
                i > sky.here && "fill-gray-slate/45",
              )}
            />
          ))}
          <text
            x={here.x}
            y={here.y + 34}
            textAnchor="middle"
            className="fill-light-peach/85 font-krone-one text-[9px] tracking-[1.6px] uppercase"
          >
            {sky.name}
          </text>
        </svg>
        <p className="font-great-vibes text-[clamp(36px,5vw,58px)] leading-[1.1] text-white">
          <AccentText text={SWITCH.line[to]} />
        </p>
        <p className={EYEBROW}>
          <span className="sr-only">{sky.name}, </span>
          {sky.where} · {SWITCH.state[to]}
        </p>
        {slow && <p className="text-sm text-white/70">{SWITCH.slow}</p>}
      </div>
    </div>,
    document.body,
  );
};

export default ModeVeil;
