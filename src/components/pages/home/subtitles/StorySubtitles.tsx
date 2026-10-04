"use client";

import clsx from "clsx";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useGlide } from "#/stores/useGlide";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { mpAt } from "#/components/three.js/star/config";
import { STORY_SUBTITLES, SUBTITLE_PACE, SUBTITLE_PLACEMENT, accentParts, nextSubtitle } from "./config";
import type { SubtitlePlacement } from "./subtitles.types";

/** How quickly the measured scroll speed follows the scroll (s): smooths frame-to-frame jitter. */
const SPEED_SMOOTHING_S = 0.15;

/** Centred, and the text too: every placement on a phone (too narrow for a side). */
const CENTRED = "left-1/2 -translate-x-1/2 text-center";

/**
 * Each placement's spot (clear of the story title, the timeline and the navigation orb)
 * and alignment — from the `sm` breakpoint up; on a phone, every placement is centred.
 */
const PLACEMENT: Record<SubtitlePlacement, string> = {
  "bottom-left": `${CENTRED} sm:left-20 sm:translate-x-0 sm:text-left md:left-24`,
  "bottom-center": CENTRED,
  "bottom-right": `${CENTRED} sm:left-auto sm:right-20 sm:translate-x-0 sm:text-right md:right-24`,
};

/** A line's text, its accent in peach. */
const LineText = ({ line }: { line: string }) =>
  accentParts(line).map((part, k) =>
    part.accent ? (
      <span key={k} className="story-subtitle__accent text-peach">
        {part.text}
      </span>
    ) : (
      part.text
    ),
  );

/**
 * The story's subtitles (P27-79): on each part of the scroll with no words of its own,
 * a line in Aymane's voice at the bottom of the screen — left, centre or right
 * (SUBTITLE_PLACEMENT, or the line's own `placement`), aligned to that side; centred on
 * a phone — white with its words in peach.
 *
 * The scroll only decides WHICH line shows (STORY_SUBTITLES: one per chapter): it fades
 * in over its own time (SUBTITLE_PACE.fadeMs) — not tied to how far you scroll — and
 * stays until its window ends, fading out the same way. None shows on the way back
 * up, each shows once per visit; only a very fast jump skips one (SUBTITLE_PACE), and a
 * line can be kept out of the assistant's glides (`onAssistantGlide`). Screen readers
 * hear each line as it shows (a polite live region; the visible copies are hidden from
 * them). Only a change of line re-renders.
 *
 * Portalled to the body (ScrollSmoother's transformed content re-bases `fixed`); with
 * reduced motion the journey isn't pinned, so there's no story to subtitle.
 */
const StorySubtitles = () => {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    setMounted(true);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (!mounted || reduced) return;
    let lastMp = useJourneyScroll.getState().progress;
    let lastTime = performance.now();
    let speed = 0; // scroll % per second, smoothed
    let backward = false; // the last move was back up (it stays so when the scroll stops)
    let settle = 0;
    let current = -1;
    const seen = new Set<number>(); // the lines shown in this visit
    const decide = () => {
      current = nextSubtitle(current, lastMp, speed, useGlide.getState().by === "assistant", backward, seen);
      if (current >= 0) seen.add(current);
      setActive(current);
    };
    const update = (mp: number) => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      if (dt > 0) {
        const instant = Math.abs(mp - lastMp) / mpAt(1) / dt;
        speed += (instant - speed) * Math.min(1, dt / SPEED_SMOOTHING_S);
      }
      if (mp !== lastMp) backward = mp < lastMp;
      lastMp = mp;
      lastTime = now;
      decide();
      // The scroll only reports movement: no news for a moment means it has stopped.
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        speed = 0;
        decide();
      }, SUBTITLE_PACE.settleMs);
    };
    decide();
    const unsubscribe = useJourneyScroll.subscribe((s) => update(s.progress));
    const unsubscribeGlide = useGlide.subscribe(decide); // a line kept out of the assistant's glides
    return () => {
      unsubscribe();
      unsubscribeGlide();
      window.clearTimeout(settle);
    };
  }, [mounted, reduced]);

  if (!mounted || reduced) return null;

  return createPortal(
    <div className="story-subtitles">
      <p className="sr-only" aria-live="polite">
        {active >= 0 ? STORY_SUBTITLES[active].line.replaceAll("*", "") : ""}
      </p>
      {STORY_SUBTITLES.map((subtitle, i) => {
        const shown = i === active;
        return (
          <p
            key={subtitle.id}
            data-shown={shown}
            aria-hidden="true"
            className={clsx(
              "story-subtitle pointer-events-none fixed bottom-24 z-[35] w-[min(19rem,calc(100vw_-_6rem))] sm:w-[min(28rem,calc(100vw_-_8rem))]",
              "text-sm font-light leading-relaxed text-white/90 sm:text-base",
              "transition-[opacity,visibility]",
              PLACEMENT[subtitle.placement ?? SUBTITLE_PLACEMENT],
              shown ? "visible opacity-100" : "invisible opacity-0",
            )}
            style={{ transitionDuration: `${SUBTITLE_PACE.fadeMs}ms` }}
          >
            <LineText line={subtitle.line} />
          </p>
        );
      })}
    </div>,
    document.body,
  );
};

export default StorySubtitles;
