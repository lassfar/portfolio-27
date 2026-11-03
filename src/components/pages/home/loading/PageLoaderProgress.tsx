"use client";

import { useEffect } from "react";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { preloadScene } from "#/components/three.js/scene/preload";
import { sceneFrames } from "#/components/three.js/scene/sceneFrames";
import { isCalm, useMotion } from "#/stores/useMotion";
import { loadPercent, loadProgress, type LoadStep } from "./loadProgress";
import { endPageLoading, isPageLoading } from "./pageLoading";

/** How long each wait may take (ms): a fetch that fails or hangs doesn't hold the page. */
const WAIT = {
  /** The journey's code, the 3D's code (as the mode switch waits). */
  code: 12000,
  /** The journey in place (its smooth scroll and pin), once its code is in. */
  placed: 6000,
  /** The 3D's first frames. */
  drawn: 6000,
  /** The ink filling the last of the bar, before the screen fades. */
  settle: 600,
} as const;

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
/** `promise`, or nothing after `ms`. */
const within = <T,>(promise: Promise<T>, ms: number) =>
  Promise.race([promise.catch(() => undefined), delay(ms).then(() => undefined)]);

/**
 * Drives the loading screen (P27-115, PageLoader) while <html> is marked `data-loading` (full
 * motion, from the head script): its bar (`--load`, `aria-valuenow`) follows the journey
 * loading, step by step (loadProgress), and it lifts once the 3D's first frames are drawn
 * (and, opened on a chapter's link, once the journey has landed there). Calm chosen meanwhile
 * (the switch, or the device setting): it lifts at once, the mode switch's screen takes over.
 * Renders nothing.
 */
const PageLoaderProgress = () => {
  useEffect(() => {
    if (!isPageLoading()) return;
    const loader = document.querySelector<HTMLElement>("[data-page-loader]");
    const done = new Set<LoadStep>();
    let over = false;

    const mark = (step: LoadStep) => {
      if (over) return;
      done.add(step);
      const progress = loadProgress(done);
      loader?.style.setProperty("--load", String(progress));
      loader?.setAttribute("aria-valuenow", String(loadPercent(progress)));
    };
    const finish = () => {
      if (over) return;
      over = true;
      endPageLoading();
    };

    void document.fonts?.ready.then(() => mark("fonts"));
    void loadJourneyMotion().then(
      () => mark("journey"),
      () => undefined,
    );
    void preloadScene().then(
      () => mark("scene"),
      () => undefined,
    );

    void (async () => {
      const journey = await within(loadJourneyMotion(), WAIT.code);
      if (journey) await journey.waitForJourney(WAIT.placed);
      mark("placed");
      await within(preloadScene(), WAIT.code);
      const from = sceneFrames.count;
      const until = performance.now() + WAIT.drawn;
      while (!over && sceneFrames.count - from < 2 && performance.now() < until) await nextFrame();
      mark("drawn");
      // A chapter's link: the journey lands there under the screen (JourneyDeepLink).
      while (!over && document.documentElement.hasAttribute("data-arriving")) await nextFrame();
      await delay(WAIT.settle);
      finish();
    })();

    const unsubscribe = useMotion.subscribe(() => {
      if (isCalm()) finish();
    });
    // Stops following, the screen left as it is: a remount (React replays effects in
    // development) follows on from here.
    return () => {
      over = true;
      unsubscribe();
    };
  }, []);
  return null;
};

export default PageLoaderProgress;
