"use client";

import gsap, { SplitText } from "gsap/all";
import { RefObject } from "react";

gsap.registerPlugin(SplitText);

export type ScrollFillElement<T extends HTMLElement = HTMLElement> = {
  ref: RefObject<T | null>;
  /** Split granularity — "chars" cascades letter-by-letter, "words" word-by-word. */
  type?: "chars" | "words";
  /** Dim start colour; each piece animates FROM this TO its natural CSS colour
   *  (so coloured spans, e.g. an accent word, fill to their own colour). */
  fromColor?: string;
  /** Upward bounce distance per piece in px (0 = no bounce). */
  y?: number;
  /** Easing — use a "back.out(n)" for a springy bounce, "power1.out" for none. */
  ease?: string;
  /** Relative share of the fill span this element occupies. */
  weight?: number;
};

type Options = {
  /** Absolute position in the timeline where the fill begins (parent units). */
  at: number;
  /** Total span the fill occupies (parent units), e.g. 1 - fillStart. */
  duration: number;
};

/**
 * Adds a scroll-scrubbed "reading reveal" onto an existing GSAP timeline: each
 * element's text starts dim and its letters (or words) colour to their natural
 * shade — optionally popping up with a bounce — as the timeline scrubs across
 * `[at, at + duration]`. Coloured spans fill to their own colour (e.g. an accent
 * word stays its accent), since each piece animates FROM the dim colour TO its
 * natural CSS value.
 *
 * Reusable companion to the `texts/` motion hooks. It mutates the timeline you
 * pass in (so it stays perfectly in sync with a pinned sequence) and returns the
 * SplitText instances so the caller can `.revert()` them on cleanup. Honours
 * reduced motion by leaving the text at its natural colour with no fill.
 */
export function addTextsScrollFill(
  timeline: gsap.core.Timeline,
  elements: ScrollFillElement[],
  { at, duration }: Options
): SplitText[] {
  const splits = elements
    .map((el) =>
      el.ref.current
        ? new SplitText(el.ref.current, {
            type: el.type === "words" ? "words" : "chars",
          })
        : null
    )
    .filter((s): s is SplitText => s !== null);

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return splits; // natural colour, no scroll fill

  const totalWeight = elements.reduce((sum, el) => sum + (el.weight ?? 1), 0);

  elements.forEach((el, i) => {
    const split = splits[i];
    if (!split) return;
    const targets = el.type === "words" ? split.words : split.chars;
    const segment = duration * ((el.weight ?? 1) / totalWeight);
    timeline.from(
      targets,
      {
        color: el.fromColor ?? "rgba(255, 255, 255, 0.18)",
        y: el.y ?? 0,
        ease: el.ease ?? "power1.out",
        duration: segment * 0.45,
        stagger: { amount: segment * 0.55 },
      },
      // First element starts at `at`; the rest cascade right after the previous.
      i === 0 ? at : ">"
    );
  });

  return splits;
}
