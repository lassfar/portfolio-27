"use client";

import { useEffect, useState, type MouseEvent } from "react";
import clsx from "clsx";
import Tooltip from "#/components/UI/tooltip/Tooltip";
import { BOOK_CHAPTERS, titleId } from "#/components/pages/home/book/chapters";
import { BOOK, CHAPTER_NAMES } from "#/components/pages/home/story/copy";
import type { ChapterId } from "#/components/pages/home/story/story.types";

/** A four-point star, like the story timeline's. */
const STAR = "M12 2.5l1.6 7.9 7.9 1.6-7.9 1.6L12 21.5l-1.6-7.9L2.5 12l7.9-1.6z";

/** The chapter on screen: the last one whose top has passed the middle of the screen (a bridge keeps the one before it). */
const chapterOnScreen = () => {
  const middle = window.innerHeight / 2;
  let current = 0;
  BOOK_CHAPTERS.forEach((id, i) => {
    const top = document.getElementById(id)?.getBoundingClientRect().top;
    if (top !== undefined && top <= middle) current = i;
  });
  return current;
};

/**
 * Jumps to a chapter, at once, and gives its heading the focus (the next Tab goes on from
 * there). Without a script, the link's own jump does it.
 */
const jumpTo = (id: ChapterId) => (event: MouseEvent<HTMLAnchorElement>) => {
  const chapter = document.getElementById(id);
  if (!chapter) return;
  event.preventDefault();
  chapter.scrollIntoView({ behavior: "instant", block: "start" });
  document.getElementById(titleId(id))?.focus({ preventScroll: true });
};

/**
 * The calm book's chapter rail (P27-93), on the left like the journey's story timeline: one
 * star per chapter, a link to it. Passed chapters are peach; the current one glows and shows
 * its name; the others name themselves on hover or focus (Escape dismisses it). The jump is
 * instant: nothing scrolls on its own in the calm mode. Hidden on phones (P27-95).
 */
const ChapterRail = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let frame = 0;
    const track = () => {
      frame = 0;
      setCurrent(chapterOnScreen());
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(track);
    };
    track();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  return (
    <nav
      aria-label={BOOK.chapters}
      className="fixed top-1/2 left-5 z-30 hidden -translate-y-1/2 flex-col gap-2 py-1.5 before:absolute before:inset-y-0 before:left-3 before:w-px before:bg-gray-slate/15 md:flex"
    >
      {BOOK_CHAPTERS.map((id, i) => (
        <a
          key={id}
          href={`#${id}`}
          aria-label={CHAPTER_NAMES[id]}
          aria-current={i === current ? "location" : undefined}
          onClick={jumpTo(id)}
          className={clsx(
            "group/tip relative grid size-6 place-items-center rounded-full focus-ring transition-colors duration-300",
            i === current
              ? "text-peach drop-shadow-[0_0_6px_rgb(255_161_74/0.7)]"
              : i < current
                ? "text-peach/65 hover:text-peach"
                : "text-gray-slate/55 hover:text-light-peach",
          )}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="size-4.25">
            <path d={STAR} />
          </svg>
          <Tooltip side="right" open={i === current || undefined}>
            {CHAPTER_NAMES[id]}
          </Tooltip>
        </a>
      ))}
    </nav>
  );
};

export default ChapterRail;
