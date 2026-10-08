import { titleId } from "#/components/pages/home/book/chapters";
import { PASSAGES } from "#/components/pages/home/story/copy";
import { CHAPTER_IDS, type ChapterId } from "#/components/pages/home/story/story.types";

/**
 * Of places in reading order, the index of the one on screen (P27-94): the last whose top
 * (px from the top of the screen) has passed `line`; the first while none has. A place not
 * in the page (`undefined`) is skipped.
 */
export const placeAt = (tops: readonly (number | undefined)[], line: number): number => {
  let current = 0;
  tops.forEach((top, i) => {
    if (top !== undefined && top <= line) current = i;
  });
  return current;
};

const topOf = (id: ChapterId) => document.getElementById(id)?.getBoundingClientRect().top;

/**
 * Where the book is (P27-94): of `ids`, the one whose top has last passed the middle of the
 * screen. By default every chapter of the story, the passages too: each has its place in the
 * book (a chapter its section, a passage its bridge), under the chapter's id.
 */
export const placeOnScreen = (ids: readonly ChapterId[] = CHAPTER_IDS): ChapterId =>
  ids[placeAt(ids.map(topOf), window.innerHeight / 2)];

/**
 * Resolves once every dotted figure on screen is drawn, or after `timeout` ms (P27-95: they're
 * drawn only near the screen, one per task): the mode switch's landing waits for them before
 * the screen fades.
 */
export function whenFiguresDrawn(timeout: number): Promise<void> {
  return new Promise((resolve) => {
    const until = performance.now() + timeout;
    const check = () => {
      const waiting = [...document.querySelectorAll<HTMLElement>("[data-dots]")].some((figure) => {
        const { top, bottom } = figure.getBoundingClientRect();
        return bottom > 0 && top < window.innerHeight && !figure.querySelector("[data-drawn]");
      });
      if (!waiting || performance.now() >= until) resolve();
      else requestAnimationFrame(check);
    };
    check();
  });
}

/**
 * Takes the book to chapter `id` at once (nothing scrolls on its own in the calm mode): its
 * section at the top, or a passage's bridge (The Voyage, The Way Out) in the middle. With
 * `focus`, the chapter's heading, or the bridge, takes the focus.
 */
export function landInBook(id: ChapterId, focus: boolean): void {
  const passage = PASSAGES.includes(id);
  const place = document.getElementById(id);
  place?.scrollIntoView({ behavior: "instant", block: passage ? "center" : "start" });
  if (focus)
    (passage ? place : document.getElementById(titleId(id)))?.focus({ preventScroll: true });
}
