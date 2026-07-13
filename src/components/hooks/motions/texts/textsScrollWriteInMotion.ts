"use client";

import gsap, { SplitText } from "gsap/all";
import { RefObject } from "react";

gsap.registerPlugin(SplitText);

export type ScrollWriteInElement<T extends HTMLElement = HTMLElement> = {
  ref: RefObject<T | null>;
  /** Split granularity — "words" reads best for paragraphs, "chars" for short lines. */
  type?: "chars" | "words";
  /** Upward rise distance per piece in px (matches the big-title write-in). */
  y?: number;
  /** Easing for each piece. */
  ease?: string;
  /** Relative share of the write-in span this element occupies. */
  weight?: number;
};

type Options = {
  /** Absolute position in the timeline where the write-in begins (parent units). */
  at: number;
  /** Total span the write-in occupies (parent units). */
  duration: number;
};

/**
 * Adds a scroll-scrubbed "write-in" onto an existing GSAP timeline: each piece
 * (word or char) rises + fades in — the SAME motion as the big-title write-in
 * (`useTextsWritingMotion`) — but driven by the timeline's scrub across
 * `[at, at + duration]` instead of playing once. Mirrors `addTextsScrollFill`'s
 * shape (mutates the passed timeline, returns the SplitText instances for
 * cleanup) and honours reduced motion by leaving the text in place.
 */
export function addTextsScrollWriteIn(
  timeline: gsap.core.Timeline,
  elements: ScrollWriteInElement[],
  { at, duration }: Options
): SplitText[] {
  const splits = elements
    .map((el) =>
      el.ref.current
        ? new SplitText(el.ref.current, {
            type: el.type === "chars" ? "chars" : "words",
          })
        : null
    )
    .filter((s): s is SplitText => s !== null);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return splits; // stay in place, no write-in

  const totalWeight = elements.reduce((sum, el) => sum + (el.weight ?? 1), 0);

  elements.forEach((el, i) => {
    const split = splits[i];
    if (!split) return;
    const targets = el.type === "chars" ? split.chars : split.words;
    const segment = duration * ((el.weight ?? 1) / totalWeight);
    timeline.from(
      targets,
      {
        opacity: 0,
        y: el.y ?? 24,
        ease: el.ease ?? "power3.out",
        duration: segment * 0.45,
        stagger: { amount: segment * 0.55 },
      },
      // First element starts at `at`; the rest cascade right after the previous.
      i === 0 ? at : ">"
    );
  });

  return splits;
}
