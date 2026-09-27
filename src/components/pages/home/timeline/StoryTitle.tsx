"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitText } from "gsap/all";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { STORY_CHAPTERS } from "./config";
import { chapterAt } from "./layout";

gsap.registerPlugin(useGSAP, SplitText);

/**
 * The story title (P27-76): a quiet editorial spine on the left edge (a thin rule, the
 * current chapter's title in wide-tracked capitals reading bottom → top, a peach dot),
 * always visible, so you know where you are even deep in the 3D scenes. Each new
 * chapter's title writes in letter by letter. The names are the one naming of the site
 * (STORY_CHAPTERS), shared with the timeline and the navigation assistant.
 *
 * Portalled to the body (ScrollSmoother's transformed content re-bases `fixed`); with
 * reduced motion the journey isn't pinned, so there's no story to follow.
 */
const StoryTitle = () => {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [index, setIndex] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setMounted(true);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const update = (mp: number) => setIndex(chapterAt(STORY_CHAPTERS, mp));
    update(useJourneyScroll.getState().progress);
    return useJourneyScroll.subscribe((s) => update(s.progress));
  }, []);

  // Each new title writes in, letter by letter (the previous split is reverted first).
  useGSAP(
    () => {
      const el = label.current;
      if (!el || index < 0) return;
      el.textContent = STORY_CHAPTERS[index].name;
      const split = new SplitText(el, { type: "chars" });
      gsap.from(split.chars, {
        autoAlpha: 0,
        duration: 0.5,
        stagger: 0.045,
        ease: "sine.out",
      });
      return () => split.revert();
    },
    { dependencies: [index, mounted], scope: root, revertOnUpdate: true },
  );

  if (!mounted || reduced) return null;

  return createPortal(
    <div ref={root} className="story-title" aria-hidden="true">
      <span className="story-title__rule" />
      <span ref={label} className="story-title__label" />
      <span className="story-title__dot" />
    </div>,
    document.body,
  );
};

export default StoryTitle;
