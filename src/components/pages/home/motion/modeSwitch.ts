import { inertExcept } from "#/components/hooks/a11y/inertExcept";
import { landInBook, placeOnScreen, whenFiguresDrawn } from "#/components/pages/home/book/place";
import { preloadBook } from "#/components/pages/home/book/preload";
import { keepDraft } from "#/components/pages/home/contact/draft";
import { loadJourneyMotion } from "#/components/pages/home/loadJourney";
import { holdInput } from "#/components/pages/home/motion/holdInput";
import { chapterIdAt } from "#/components/pages/home/scroll/chapters";
import { CHAPTER_NAMES, SWITCH } from "#/components/pages/home/story/copy";
import type { ChapterId } from "#/components/pages/home/story/story.types";
import { preloadScene } from "#/components/three.js/scene/preload";
import { sceneFrames } from "#/components/three.js/scene/sceneFrames";
import { motionMode, type MotionChoice } from "#/stores/motionPreference";
import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { useModeSwitch, type SwitchVeil } from "#/stores/useModeSwitch";
import { holdMotionAttribute, isCalm, useMotion } from "#/stores/useMotion";
import { usePanelStore } from "#/stores/usePanelStore";

/** The switch's timing (ms), as the sketch agreed it (docs/design/mockups/13-mode-transition.html). */
const TIMING = {
  /** The screen fading in: slower into calm. */
  fadeIn: { calm: 500, full: 400 },
  fadeOut: 500,
  /** How long it stays opaque at least, so it reads. */
  hold: { calm: 1400, full: 1700 },
  /** Waiting for the journey's pin, for its code and the 3D's, then for the 3D's first frames. */
  pin: 3000,
  code: 20000,
  scene: 8000,
  /** Waiting for the book's figures: their code, then the ones on screen drawn. */
  figures: 3000,
  /** Once the scene has drawn, a moment more for it to settle. */
  settle: 150,
  /** When the screen says the 3D is taking its time. */
  slow: 3000,
  /** How long the status line stays. */
  status: 4000,
};

/** What a switch keeps above the page: the screen, the switch and the status line. */
const KEEP = "data-mode-keep";

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
/** `promise`, or nothing after `ms`: a fetch that fails or hangs doesn't hold the switch. */
const within = (promise: Promise<unknown>, ms: number) =>
  Promise.race([promise.catch(() => undefined), delay(ms)]);

const setVeil = (veil: Partial<SwitchVeil>) =>
  useModeSwitch.setState((s) => ({ veil: s.veil && { ...s.veil, ...veil } }));

/** Where the visitor is, in the mode on screen: a chapter of the story, the passages too. */
const placeIn = (mode: MotionChoice): ChapterId =>
  mode === "full" ? chapterIdAt(useJourneyScroll.getState().progress) : placeOnScreen();

/** The motion switch's button: it keeps the focus through a switch. */
const switchButton = () => document.querySelector<HTMLElement>("[data-motion-switch] button");

/** Whether the focus is in the page (not on the switch, nor nowhere). */
const focusInPage = () => {
  const active = document.activeElement;
  return !!active && active !== document.body && !switchButton()?.contains(active);
};

/**
 * Gives the focus a place in the new mode, if it was in the page (P27-94, WCAG 2.4.3): the
 * landing chapter's heading (or passage) in the book; in the journey, the timeline's current
 * star, else the switch.
 */
function refocus(mode: MotionChoice, place: ChapterId) {
  if (mode === "calm") return landInBook(place, true);
  const star = document.querySelector<HTMLElement>(
    'nav.story-timeline button[aria-current="step"]',
  );
  const shown = star && getComputedStyle(star).visibility === "visible";
  (shown ? star : switchButton())?.focus({ preventScroll: true });
}

/**
 * Brings the mode on screen to `to`, landing on `place` (behind the screen, opaque by now):
 * the old tree unmounts, the new one mounts on the client, lands, and is ready. Returns what
 * keeps it landed until the reveal.
 */
async function swap(to: MotionChoice, place: ChapterId, signal: AbortSignal) {
  if (to === "calm") {
    // The page's CSS turns to the new mode with it.
    holdMotionAttribute(to);
    useModeSwitch.setState({ shown: to });
    await nextFrame();
    landInBook(place, false);
    // Its figures draw in and its length changes: landed again until the reveal.
    const resized = new ResizeObserver(() => landInBook(place, false));
    resized.observe(document.body);
    await within(preloadBook(), TIMING.figures);
    await whenFiguresDrawn(TIMING.figures);
    await nextFrame();
    await nextFrame();
    return () => resized.disconnect();
  }

  const slow = setTimeout(() => {
    setVeil({ slow: true });
    useModeSwitch.setState({ status: SWITCH.slow });
  }, TIMING.slow);
  try {
    // The journey's motion code first (P27-95: the calm mode never fetched it), so it mounts
    // ready and the wait for its pin isn't spent on a fetch.
    await within(loadJourneyMotion(), TIMING.code);
    // Its pin measures from the top; the page's CSS turns to motion (a link drawing in).
    window.scrollTo(0, 0);
    holdMotionAttribute(to);
    useModeSwitch.setState({ shown: to });
    await nextFrame();
    let release = () => {};
    const journey = loadJourneyMotion.loaded;
    if (journey && (await journey.waitForJourney(TIMING.pin, signal))) {
      journey.refreshJourney();
      journey.landJourney(place);
      release = journey.holdJourneyOn(place);
    }
    // The 3D: its code, then a couple of frames drawn, then a moment to settle.
    await within(preloadScene(), TIMING.code);
    const from = sceneFrames.count;
    const until = performance.now() + TIMING.scene;
    while (sceneFrames.count - from < 2 && performance.now() < until && !signal.aborted) {
      await nextFrame();
    }
    await delay(TIMING.settle);
    return release;
  } finally {
    clearTimeout(slow);
  }
}

/**
 * One switch, under the transition screen (P27-94): capture where the visitor is, cover the
 * page, swap the modes (again, if the target changes meanwhile), land, then reveal. Whatever
 * happens, the page is given back: input, focus, and the mode it shows.
 */
async function switchOnce(from: MotionChoice, signal: AbortSignal) {
  const root = document.documentElement;
  // Capture, in the click's own task. (No glide without the journey's code.)
  loadJourneyMotion.loaded?.stopGlide();
  const place = placeIn(from);
  const refocusAfter = focusInPage();
  keepDraft();
  usePanelStore.getState().close();
  holdMotionAttribute(from);
  root.setAttribute("data-mode-switching", "");
  let to = motionMode(isCalm());
  void (to === "full" ? Promise.all([loadJourneyMotion(), preloadScene()]) : preloadBook()).catch(
    () => undefined,
  );
  useModeSwitch.setState({ veil: { to, place, shown: true, slow: false }, status: "" });

  // Cover: once the panel's close has committed, the page goes inert under the screen.
  await nextFrame();
  const releaseInert = inertExcept((el) => el.hasAttribute(KEEP));
  const releaseInput = holdInput();
  let shown = from;
  let landed = () => {};
  try {
    await delay(TIMING.fadeIn[to] + 50);
    const opaqueAt = performance.now();
    while (!signal.aborted && motionMode(isCalm()) !== shown) {
      to = motionMode(isCalm());
      setVeil({ to });
      landed();
      landed = await swap(to, place, signal);
      shown = to;
    }
    await delay(Math.max(0, TIMING.hold[to] - (performance.now() - opaqueAt)));
  } finally {
    // Reveal: landed once more, the page given back.
    if (shown === "full") loadJourneyMotion.loaded?.landJourney(place);
    else landInBook(place, false);
    landed();
    releaseInput();
    releaseInert();
    root.removeAttribute("data-mode-switching");
    holdMotionAttribute(null);
    if (refocusAfter) refocus(shown, place);
    useModeSwitch.setState({
      status: `${SWITCH.state[shown]}: ${CHAPTER_NAMES[place]}`,
    });
    setVeil({ shown: false, slow: false });
  }
  await delay(TIMING.fadeOut);
  useModeSwitch.setState({ veil: null });
  return shown;
}

/**
 * Switches the modes live (P27-94): whenever the preference changes (the switch, or the
 * device setting during the visit), the page moves to the other mode behind the transition
 * screen, on the same chapter, without a reload. `initial` is the mode the page loaded in.
 * Returns the stop.
 */
export function startModeSwitch(initial: MotionChoice): () => void {
  const abort = new AbortController();
  const shown = () => useModeSwitch.getState().shown ?? initial;
  let running = false;
  let statusTimer = 0;

  const run = async () => {
    if (running || motionMode(isCalm()) === shown()) return;
    running = true;
    window.clearTimeout(statusTimer);
    try {
      while (!abort.signal.aborted && motionMode(isCalm()) !== shown()) {
        await switchOnce(shown(), abort.signal);
      }
    } catch (error) {
      // The page was given back (switchOnce's finally); a broken switch is only reported.
      console.error(error);
    } finally {
      running = false;
    }
    // Said once: the status line clears after a while.
    statusTimer = window.setTimeout(() => useModeSwitch.setState({ status: "" }), TIMING.status);
  };

  const stop = useMotion.subscribe(() => void run());
  return () => {
    stop();
    abort.abort();
    window.clearTimeout(statusTimer);
  };
}
