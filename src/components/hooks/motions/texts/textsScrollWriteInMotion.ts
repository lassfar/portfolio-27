"use client";

import gsap, { SplitText } from "gsap/all";
import { RefObject } from "react";
import { WRITE_IN_PACE } from "#/components/hooks/motions/texts/writeInPace";

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
  /**
   * What SplitText does for screen readers (its `aria`): "auto" labels the element with its
   * text and hides the pieces, which suits a heading but not a `<p>` (a label there is ignored:
   * the text goes silent). "none" for an element hidden from them already, whose words are read
   * from a copy (P27-100).
   */
  aria?: "auto" | "none";
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
 * `[at, at + duration]` instead of playing once. Mutates the passed timeline and
 * returns the SplitText instances for cleanup. The journey's only (with motion: the
 * calm mode reads the book, P27-93).
 */
export function addTextsScrollWriteIn(
  timeline: gsap.core.Timeline,
  elements: ScrollWriteInElement[],
  { at, duration }: Options,
): SplitText[] {
  // One per element (null where its ref isn't set), so each keeps its own split.
  const splits = elements.map((el) =>
    el.ref.current
      ? new SplitText(el.ref.current, {
          type: el.type === "chars" ? "chars" : "words",
          aria: el.aria ?? "auto",
        })
      : null,
  );

  const totalWeight = elements.reduce((sum, el) => sum + (el.weight ?? 1), 0);

  let placed = false; // the first element that splits starts at `at`
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
        duration: segment * WRITE_IN_PACE.fade,
        stagger: { amount: segment * WRITE_IN_PACE.stagger },
      },
      // The first one starts at `at`; the rest cascade right after the previous.
      placed ? ">" : at,
    );
    placed = true;
  });

  return splits.filter((s): s is SplitText => s !== null);
}
