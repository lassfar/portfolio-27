"use client";

import { useEffect } from "react";
import { sceneFrames } from "#/components/three.js/scene/sceneFrames";
import { isScrollLocked } from "#/stores/scrollLock";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { chapterIdAt } from "./chapters";
import { chapterFromHash, followInAddress } from "./deepLink";
import { holdJourneyOn, landJourney, refreshJourney, waitForJourney } from "./land";

/** How long the journey may take to be in place for a link (ms), as the skip link waits. */
const READY_MS = 3000;
/** How long the 3D may take to draw its first frames on the landed chapter (ms). */
const SCENE_MS = 3000;

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** The page is no longer held for a link's landing: it shows (globals.css, data-arriving). */
const arrived = () => document.documentElement.removeAttribute("data-arriving");

/**
 * Lands on a link's chapter (P27-113), held there while the 3D draws its first frames (as the
 * mode switch does), then shows the page. Resolves once done or given up.
 */
async function arrive(signal: AbortSignal): Promise<void> {
  const id = chapterFromHash(window.location.hash);
  if (!id || id === "origin") return;
  if (!(await waitForJourney(READY_MS, signal))) return;
  refreshJourney();
  landJourney(id);
  const release = holdJourneyOn(id);
  const from = sceneFrames.count;
  const until = performance.now() + SCENE_MS;
  while (sceneFrames.count - from < 2 && performance.now() < until && !signal.aborted) {
    await nextFrame();
  }
  if (!signal.aborted) landJourney(id);
  release();
}

/**
 * The journey's side of the chapter links (P27-113), with its other parts (JourneyParts):
 * - **arriving**: opened on `#craft`, it lands on the Craft's resting view; the head script
 *   (MOTION_SCRIPT) kept the journey hidden meanwhile (`data-arriving`), so the hero never
 *   flashes;
 * - **following**: the chapter on screen goes into the address once it holds, without a
 *   history entry (deepLink.ts);
 * - **a hash changed in place** (typed, an in-page link) lands the same way; not while a panel
 *   holds the scroll.
 * Not on a mode switch's remount: the switch lands its own place. Renders nothing.
 */
const JourneyDeepLink = () => {
  useEffect(() => {
    const switching = document.documentElement.hasAttribute("data-mode-switching");
    const controller = new AbortController();
    if (switching) arrived();
    else void arrive(controller.signal).finally(() => controller.signal.aborted || arrived());

    const address = followInAddress();
    const unsubscribe = useJourneyScroll.subscribe((s) => address.see(chapterIdAt(s.progress)));

    const onHash = () => {
      const id = chapterFromHash(window.location.hash);
      if (id && !isScrollLocked()) landJourney(id);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      controller.abort();
      unsubscribe();
      address.stop();
      window.removeEventListener("hashchange", onHash);
    };
  }, []);
  return null;
};

export default JourneyDeepLink;
