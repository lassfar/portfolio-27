"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { mpAt } from "#/components/three.js/star/config";
import {
  glideToJourney,
  stopGlideOnInput,
} from "#/components/pages/home/scroll/glide";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { useTimelineTuning } from "#/stores/useTimelineTuning";
import { STEP_BACK_IN_FULL_VIEW } from "#/components/pages/home/panel/layout";
import { PHASE_STOPS } from "#/components/pages/home/phase-nav/config";
import { STORY_CHAPTERS, TIMELINE } from "./config";
import { chapterAt, chapterPositions, fillAt, railLayout } from "./layout";
import StoryTimelineRail from "./StoryTimelineRail";
import type {
  StoryTimelineRest,
  StoryTimelineToast,
} from "./StoryTimeline.types";

/**
 * The story timeline, live: it follows the pinned journey's scroll (useJourneyScroll).
 * - The fill moves every frame, straight on the DOM. The chapter, visibility and rest
 *   state only re-render when they change.
 * - It shows after the hero's first screen. After a moment without scrolling it dims,
 *   then hides if TIMELINE.hideAfter is set.
 * - A new chapter's name pops up by its star (TIMELINE.nameOnChange; always on phones,
 *   which have no hover).
 * - Clicking a star glides the smooth scroll to that chapter's resting point.
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
  const railPx =
    ((horizontal ? viewport.width : viewport.height) * railLength) / 100;
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
        fill.style[horizontal ? "width" : "height"] =
          `${fillAt(STORY_CHAPTERS, positions, mp) * 100}%`;
      }
      setCurrent(chapterAt(STORY_CHAPTERS, mp));
      setShown(mp >= mpAt(TIMELINE.showAfter));
      setRest("awake");
      window.clearTimeout(dimTimer);
      window.clearTimeout(hideTimer);
      dimTimer = window.setTimeout(
        () => setRest("dim"),
        TIMELINE.dimAfter * 1000,
      );
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
  useEffect(stopGlideOnInput, []);

  // Glide to a chapter (not while a panel holds the scroll): to its resting point (the
  // phase buttons' — Saturn built, the Earth up close, the probe's close-up…), so you
  // arrive on the chapter itself, not the tail of the one before; else just inside it.
  const glideTo = useCallback((index: number) => {
    const chapter = STORY_CHAPTERS[index];
    const rest = PHASE_STOPS.find((s) => s.id === chapter.id);
    const mp = rest
      ? rest.target
      : index === 0
        ? 0
        : chapter.start + mpAt(TIMELINE.glideInside);
    glideToJourney(mp, TIMELINE.glideSeconds, undefined, "timeline");
  }, []);

  if (!mounted || reduced) return null;

  // (A wrapper steps it back in the full view: the rail's own CSS sets its opacity.)
  return createPortal(
    <div className={STEP_BACK_IN_FULL_VIEW}>
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
      />
    </div>,
    document.body,
  );
};

export default StoryTimeline;
