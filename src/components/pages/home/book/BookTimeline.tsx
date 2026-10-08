"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import StoryTimelineRail from "#/components/pages/home/timeline/StoryTimelineRail";
import type {
  StoryChapter,
  StoryTimelineToast,
} from "#/components/pages/home/timeline/StoryTimeline.types";
import { chapterPositions, phoneQuery, railPxFor } from "#/components/pages/home/timeline/layout";
import { BOOK_CHAPTERS } from "#/components/pages/home/book/chapters";
import { landInBook, placeOnScreen } from "#/components/pages/home/book/place";
import { BOOK_TIMELINE } from "#/components/pages/home/book/timeline";
import { CHAPTER_NAMES } from "#/components/pages/home/story/copy";

/** The book's chapters on the timeline, before they're measured: evenly spread. */
const UNMEASURED: StoryChapter[] = BOOK_CHAPTERS.map((id, i) => ({
  id,
  name: CHAPTER_NAMES[id],
  start: i / (BOOK_CHAPTERS.length - 1),
}));

/** Where each chapter starts in the book's scroll (0..1), from where its section is now. */
const measureChapters = (): StoryChapter[] => {
  const range = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return BOOK_CHAPTERS.map((id) => {
    const top = (document.getElementById(id)?.getBoundingClientRect().top ?? 0) + window.scrollY;
    return { id, name: CHAPTER_NAMES[id], start: Math.min(1, Math.max(0, top / range)) };
  });
};

/** The chapter on screen (a bridge, a passage's too, keeps the one before it). */
const chapterOnScreen = () => BOOK_CHAPTERS.indexOf(placeOnScreen(BOOK_CHAPTERS));

/** Jumps to a chapter, at once (nothing scrolls on its own in the calm mode), and gives its heading the focus. */
const jumpTo = (index: number) => landInBook(BOOK_CHAPTERS[index], true);

/**
 * The calm book's timeline (P27-93): the journey's story timeline (StoryTimelineRail), on
 * the right like in the journey, one star per chapter of the book, driven by the book's own
 * scroll. Calm, and within WCAG:
 * - its look (BOOK_TIMELINE): marks at 3:1 or more, the chapters ahead shown, no dimming, no
 *   breathing, nothing growing (the calm rules in globals.css);
 * - its fill reaches the current chapter only, not the scroll;
 * - a click jumps to the chapter at once and focuses its heading;
 * - on a phone, a new chapter's name shows by its star for a moment (not read out: the
 *   chapters are headings).
 * Hidden on the cover's first screen, like the journey's on the hero.
 */
const BookTimeline = () => {
  const [chapters, setChapters] = useState<StoryChapter[]>(UNMEASURED);
  const [railPx, setRailPx] = useState(0);
  const [current, setCurrent] = useState(0);
  const [shown, setShown] = useState(false);
  const [phone, setPhone] = useState(false);
  const [toast, setToast] = useState<StoryTimelineToast>();
  const lastChapter = useRef<number | null>(null);
  const toastTimer = useRef(0);

  useEffect(() => {
    const small = window.matchMedia(phoneQuery(BOOK_TIMELINE));
    let frame = 0;
    const track = () => {
      frame = 0;
      setCurrent(chapterOnScreen());
      setShown(window.scrollY >= (window.innerHeight * BOOK_TIMELINE.showAfter) / 100);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(track);
    };
    const measure = () => {
      setChapters(measureChapters());
      setRailPx(railPxFor(BOOK_TIMELINE, window.innerHeight, BOOK_CHAPTERS.length));
      setPhone(small.matches);
      queue();
    };
    measure();
    // The book's length changes as its figures draw and on resize: measured again.
    const resized = new ResizeObserver(measure);
    resized.observe(document.body);
    window.addEventListener("scroll", queue, { passive: true });
    small.addEventListener("change", measure);
    return () => {
      cancelAnimationFrame(frame);
      resized.disconnect();
      window.removeEventListener("scroll", queue);
      small.removeEventListener("change", measure);
    };
  }, []);

  // On a phone (no hover), a new chapter's name shows by its star for a moment.
  useEffect(() => {
    const previous = lastChapter.current;
    lastChapter.current = current;
    if (previous === null || previous === current || !shown || !phone) return;
    setToast({ index: current, on: true });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(
      () => setToast((t) => t && { ...t, on: false }),
      BOOK_TIMELINE.nameSeconds * 1000,
    );
  }, [current, shown, phone]);
  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const positions = useMemo(
    () => chapterPositions(chapters, BOOK_TIMELINE.minGap, railPx),
    [chapters, railPx],
  );

  return (
    <StoryTimelineRail
      chapters={chapters}
      positions={positions}
      current={current}
      fill={positions[current] ?? 0}
      shown={shown}
      rest="awake"
      phone={phone}
      toast={toast}
      onSelect={jumpTo}
      tuning={BOOK_TIMELINE}
      announce={false}
    />
  );
};

export default BookTimeline;
