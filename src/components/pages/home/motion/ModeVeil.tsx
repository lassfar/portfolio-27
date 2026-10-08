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
  // The name sits under its star, kept on screen at the sky's ends.
  const x = (here.x / SKY.width) * 100;
  const anchor = x < 20 ? "0" : x > 80 ? "-100%" : "-50%";

  return createPortal(
    <div
      aria-hidden={!shown || undefined}
      data-mode-veil
      data-mode-keep
      className={clsx(
        "fixed inset-0 z-65 grid place-items-center bg-rich-black px-6",
        "transition-[opacity,visibility] ease-out starting:opacity-0",
        // Fading out, it lets clicks and the focus through at once (WCAG 2.4.11).
        shown ? "visible opacity-100" : "pointer-events-none invisible opacity-0",
        shown && to === "full" ? "duration-400" : "duration-500",
      )}
    >
      <div className="flex flex-col items-center gap-4.5 text-center">
        {/* As wide as the screen allows, and short enough to leave room for the words on a
            phone held sideways (P27-95). */}
        <div className="relative w-[min(640px,86vw,calc((100svh-180px)*3.2))]">
          <svg
            viewBox={`0 0 ${SKY.width} ${SKY.height}`}
            aria-hidden="true"
            className="h-auto w-full overflow-visible"
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
          </svg>
          {/* The landing chapter's name: HTML, not the drawing's, so it stays readable however
            small the sky (11 px; it was 4 px on a phone, P27-95). Said in the eyebrow too. */}
          <span
            aria-hidden="true"
            data-sky-name
            className="absolute font-krone-one text-[11px] tracking-[1.6px] whitespace-nowrap text-light-peach/85 uppercase"
            style={{
              left: `${x}%`,
              top: `${((here.y + 24) / SKY.height) * 100}%`,
              translate: `${anchor} 0`,
            }}
          >
            {sky.name}
          </span>
        </div>
        <p className="font-great-vibes text-[clamp(36px,5vw,58px)] leading-[1.1] text-white">
          <AccentText text={SWITCH.line[to]} />
        </p>
        <p className={clsx(EYEBROW, "text-balance")}>
          <span className="sr-only">{sky.name}, </span>
          {sky.where} · {SWITCH.state[to]}
        </p>
        {slow && <p className="text-sm text-white/70">{SWITCH.slow}</p>}
      </div>
    </div>,
    document.body,
  );
};

export default ModeVeil;
