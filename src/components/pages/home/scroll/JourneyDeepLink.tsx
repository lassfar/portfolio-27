"use client";

import { useEffect } from "react";
import { sceneFrames } from "#/components/three.js/scene/sceneFrames";
import { isScrollLocked } from "#/stores/scrollLock";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { chapterIdAt } from "./chapters";
import { chapterFromHash, followInAddress } from "./deepLink";
import { holdJourneyOn, landJourney, refreshJourney, waitForJourney } from "./land";

/**
 * How long the journey may take to be in place for a link (ms): a slow first load takes long
 * (P27-117), and the loading screen covers the page meanwhile (up to LOADING_FAILSAFE_MS).
 */
const READY_MS = 12000;
/** How long the 3D may take to draw its first frames on the landed chapter (ms). */
const SCENE_MS = 3000;

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/** The page is no longer held for a link's landing: it shows (globals.css, data-arriving). */
const arrived = () => document.documentElement.removeAttribute("data-arriving");

/** What says the visitor is moving on from a landing: the scroll, a touch, a key, a click. */
const MOVING_ON = ["wheel", "touchstart", "keydown", "pointerdown"] as const;

/** Resolves on the visitor's first move (MOVING_ON), or once `signal` aborts. */
function visitorMoves(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      MOVING_ON.forEach((type) => window.removeEventListener(type, done, true));
      signal.removeEventListener("abort", done);
      resolve();
    };
    MOVING_ON.forEach((type) =>
      window.addEventListener(type, done, { capture: true, passive: true }),
    );
    signal.addEventListener("abort", done);
  });
}

/**
 * Lands on a link's chapter (P27-113), held there while the 3D draws its first frames (as the
 * mode switch does). Resolves once landed (or given up) with the hold's stop: the page shows
 * then, and the hold stays until the visitor moves on (P27-117). A slow first load measures the
 * journey again later (ScrollTrigger refreshes on the window's `load`, the fonts…), keeping the
 * scroll in pixels while its chapters moved: unheld, the link ended on the next chapter.
 */
async function arrive(signal: AbortSignal): Promise<(() => void) | null> {
  const id = chapterFromHash(window.location.hash);
  if (!id || id === "origin") return null;
  if (!(await waitForJourney(READY_MS, signal))) return null;
  refreshJourney();
  landJourney(id);
  const release = holdJourneyOn(id);
  const from = sceneFrames.count;
  const until = performance.now() + SCENE_MS;
  while (sceneFrames.count - from < 2 && performance.now() < until && !signal.aborted) {
    await nextFrame();
  }
  if (!signal.aborted) landJourney(id);
  return release;
}

/**
 * The journey's side of the chapter links (P27-113), with its other parts (JourneyParts):
 * - **arriving**: opened on `#craft`, it lands on the Craft's resting view; the head script
 *   (MOTION_SCRIPT) kept the journey hidden meanwhile (`data-arriving`), so the hero never
 *   flashes; it stays landed there until the visitor moves on, whatever the page measures again;
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
    else
      void arrive(controller.signal).then(async (release) => {
        if (!controller.signal.aborted) arrived();
        if (!release) return;
        await visitorMoves(controller.signal);
        release();
      }, arrived);

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
