"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { landInBook } from "#/components/pages/home/book/place";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { LOGO_ALT } from "#/components/pages/home/story/copy";
import { isCalm } from "#/stores/useMotion";
import { usePanelStore } from "#/stores/usePanelStore";

/** How long the journey may take to be ready, and a closing panel to let go of the scroll (ms). */
const READY_MS = 3000;
const RELEASE_MS = 1000;

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

/**
 * Back to the top: the book jumps to its cover; the journey glides to its start, the story playing
 * back. An open panel closes first (it holds the scroll, and `goTo` doesn't move until it lets go).
 */
async function backToTop() {
  usePanelStore.getState().close();
  if (isCalm()) return landInBook("origin", false);
  const journey = await loadJourneyMotion();
  if (!(await journey.waitForJourney(READY_MS))) return;
  const until = performance.now() + RELEASE_MS;
  while (!journey.goTo("origin") && performance.now() < until) await nextFrame();
}

/**
 * The site's logo (P27-119), in the top-left corner all through the visit, in both modes: a link
 * back to the top (without JS, to the book's cover). In the page's banner, after its controls
 * (the Reduce motion switch stays the first Tab stop). Away under what covers the whole page: the
 * loading screen (it fades in as that lifts), the mode switch's screen, the panel's full view;
 * the photo viewer covers it and makes it inert. It stays with the side panel, on the other side.
 *
 * next/image serves an `.svg` as is (`unoptimized`, automatically): sharp at any size. Its real
 * `width` and `height` reserve its room; `h-auto` and the width classes size it. Eager, not
 * preloaded: small, and not the page's largest paint, but it shouldn't appear late.
 */
const PageLogo = () => {
  const go = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    void backToTop();
  };
  return (
    <a
      href="#origin"
      onClick={go}
      className="tap-target fixed top-4.5 left-4.5 z-46 block rounded-sm focus-ring brightness-90 drop-shadow-[0_0_6px_rgb(25_25_28/0.85)] transition-[opacity,visibility,filter] duration-500 hover:brightness-110 sm:top-6 sm:left-6 panel-full:invisible panel-full:opacity-0 switching:invisible switching:opacity-0 loading:invisible loading:opacity-0"
    >
      <Image
        src="/logo/AL-LOGO.svg"
        width={86}
        height={45}
        alt={LOGO_ALT}
        loading="eager"
        className="h-auto w-10 sm:w-12"
      />
    </a>
  );
};

export default PageLogo;
