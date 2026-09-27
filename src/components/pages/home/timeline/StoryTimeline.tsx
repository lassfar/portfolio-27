"use client";

import gsap from "gsap";
import { ScrollSmoother } from "gsap/all";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mpAt } from "#/components/three.js/star/config";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { isScrollLocked } from "#/stores/scrollLock";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { useTimelineTuning } from "#/stores/useTimelineTuning";
import { STORY_CHAPTERS, TIMELINE } from "./config";
import { chapterAt, chapterPositions, fillAt, railLayout } from "./layout";
import StoryTimelineRail from "./StoryTimelineRail";
import type { StoryTimelineRest, StoryTimelineToast } from "./StoryTimeline.types";

/**
 * The story timeline, live: it follows the pinned journey's scroll (useJourneyScroll).
 * - The fill moves every frame, straight on the DOM. The chapter, visibility and rest
 *   state only re-render when they change.
 * - It shows after the hero's first screen. After a moment without scrolling it dims,
 *   then hides if TIMELINE.hideAfter is set.
 * - A new chapter's name pops up by its star (TIMELINE.nameOnChange; always on phones,
 *   which have no hover).
 * - Clicking a star glides the smooth scroll to that chapter.
 * - The dev panel (TimelineGui) edits TIMELINE live; its `rev` re-renders this.
 *
 * Portalled to the body, like the Earth gallery and the Lab: the page content lives in
 * ScrollSmoother's transformed `#smooth-content`, which would re-base
 * `position: fixed`. With reduced motion the journey isn't pinned (no story to track),
 * so there's no timeline.
 */
const StoryTimeline = () => {
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [phone, setPhone] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [current, setCurrent] = useState(0);
  const [shown, setShown] = useState(false);
  const [rest, setRest] = useState<StoryTimelineRest>("awake");
  const [toast, setToast] = useState<StoryTimelineToast>();
  const fillRef = useRef<HTMLDivElement>(null);
  const lastChapter = useRef<number | null>(null);
  const toastTimer = useRef(0);

  useTimelineTuning((s) => s.rev); // re-render when the dev panel edits TIMELINE in place
  const { minGap, railLength } = TIMELINE;
  const { horizontal } = railLayout(TIMELINE);
  const railPx = ((horizontal ? viewport.width : viewport.height) * railLength) / 100;
  const positions = useMemo(
    () => chapterPositions(STORY_CHAPTERS, minGap, railPx),
    [minGap, railPx],
  );

  // The viewport: reduced motion, the phone layout, and its height (the rail's, for the gaps).
  useEffect(() => {
    setMounted(true);
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const small = window.matchMedia(`(max-width: ${TIMELINE.phoneMaxWidth}px)`);
    const measure = () => {
      setReduced(motion.matches);
      setPhone(small.matches);
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    motion.addEventListener("change", measure);
    small.addEventListener("change", measure);
    return () => {
      window.removeEventListener("resize", measure);
      motion.removeEventListener("change", measure);
      small.removeEventListener("change", measure);
    };
  }, []);

  // Follow the story's scroll.
  useEffect(() => {
    let dimTimer = 0;
    let hideTimer = 0;
    const update = (mp: number) => {
      const fill = fillRef.current;
      if (fill) {
        fill.style.width = fill.style.height = ""; // the direction may have changed (dev panel)
        fill.style[horizontal ? "width" : "height"] = `${fillAt(STORY_CHAPTERS, positions, mp) * 100}%`;
      }
      setCurrent(chapterAt(STORY_CHAPTERS, mp));
      setShown(mp >= mpAt(TIMELINE.showAfter));
      setRest("awake");
      window.clearTimeout(dimTimer);
      window.clearTimeout(hideTimer);
      dimTimer = window.setTimeout(() => setRest("dim"), TIMELINE.dimAfter * 1000);
      if (TIMELINE.hideAfter > 0) {
        hideTimer = window.setTimeout(
          () => setRest("hidden"),
          (TIMELINE.dimAfter + TIMELINE.hideAfter) * 1000,
        );
      }
    };
    update(useJourneyScroll.getState().progress);
    const unsubscribe = useJourneyScroll.subscribe((s) => update(s.progress));
    return () => {
      unsubscribe();
      window.clearTimeout(dimTimer);
      window.clearTimeout(hideTimer);
    };
  }, [positions, horizontal, mounted]);

  // A new chapter's name pops up by its star for a moment.
  useEffect(() => {
    const previous = lastChapter.current;
    lastChapter.current = current;
    if (previous === null || previous === current || !shown) return;
    if (!TIMELINE.nameOnChange && !phone) return;
    setToast({ index: current, on: true });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setToast((t) => t && { ...t, on: false }),
      TIMELINE.nameSeconds * 1000,
    );
  }, [current, shown, phone]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  // A wheel, touch or key press takes the scroll back from a glide.
  useEffect(() => {
    const stop = () => {
      const smoother = ScrollSmoother.get();
      if (smoother) gsap.killTweensOf(smoother, "scrollTop");
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);
    return () => {
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
  }, []);

  // Glide to a chapter, landing just inside it (not while a panel holds the scroll).
  const glideTo = useCallback((index: number) => {
    const trigger = journeyTrigger.current;
    if (!trigger || isScrollLocked()) return;
    const mp = index === 0 ? 0 : STORY_CHAPTERS[index].start + mpAt(TIMELINE.glideInside);
    const y = trigger.start + mp * (trigger.end - trigger.start);
    const smoother = ScrollSmoother.get();
    if (!smoother) {
      window.scrollTo({ top: y, behavior: "smooth" });
      return;
    }
    gsap.to(smoother, {
      scrollTop: y,
      duration: TIMELINE.glideSeconds,
      ease: "power3.inOut",
      overwrite: true,
    });
  }, []);

  if (!mounted || reduced) return null;

  return createPortal(
    <StoryTimelineRail
      chapters={STORY_CHAPTERS}
      positions={positions}
      current={current}
      fillRef={fillRef}
      shown={shown}
      rest={rest}
      phone={phone}
      toast={toast}
      onSelect={glideTo}
    />,
    document.body,
  );
};

export default StoryTimeline;
