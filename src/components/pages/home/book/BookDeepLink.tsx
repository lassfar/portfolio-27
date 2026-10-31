"use client";

import { useEffect } from "react";
import { useGateLive } from "#/components/pages/home/motion/gateLive";
import { chapterFromHash, followInAddress } from "#/components/pages/home/scroll/deepLink";
import { usePanelStore } from "#/stores/usePanelStore";
import { landInBook, placeOnScreen } from "./place";

/**
 * The calm book's side of the chapter links (P27-113), once the book is the page (live):
 * - **arriving**: opened on `#craft`, it shows the Craft as the timeline places it (a passage,
 *   the Voyage or the Way Out, centred); the browser's own jump to the id came first;
 * - **following**: the chapter on screen goes into the address once it holds, without a
 *   history entry (deepLink.ts);
 * - **a hash changed in place** lands the same way; not while a panel holds the scroll.
 * Not on a mode switch's remount: the switch lands its own place. Renders nothing.
 */
const BookDeepLink = () => {
  const live = useGateLive();
  useEffect(() => {
    if (!live) return;
    const land = () => {
      const id = chapterFromHash(window.location.hash);
      // Not under an open panel (the panel's store: the scroll lock would load GSAP here).
      if (id && usePanelStore.getState().content === null) landInBook(id, false);
    };
    if (!document.documentElement.hasAttribute("data-mode-switching")) land();

    const address = followInAddress();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => address.see(placeOnScreen()));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", land);
    return () => {
      cancelAnimationFrame(frame);
      address.stop();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", land);
    };
  }, [live]);
  return null;
};

export default BookDeepLink;
