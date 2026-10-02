import { useJourneyScroll } from "#/stores/useJourneyScroll";
import { createBuildQueue } from "./buildQueue";

/** The most of an idle period one slice of building may use (ms). */
const SLICE_MS = 8;
/** At the latest this long between slices, even if the browser never idles (ms). */
const IDLE_TIMEOUT_MS = 200;

function idle(run: (budgetMs: number) => void) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(
      (deadline) =>
        run(deadline.didTimeout ? SLICE_MS : Math.max(1, Math.min(SLICE_MS, deadline.timeRemaining()))),
      { timeout: IDLE_TIMEOUT_MS },
    );
  } else {
    window.setTimeout(() => run(SLICE_MS), 16);
  }
}

/**
 * The scene's build queue (see buildQueue): heavy particle builds in story order, in
 * idle time, finished just in time if the journey gets ahead of them.
 */
export const sceneBuilds = createBuildQueue({
  now: () => performance.now(),
  mp: () => useJourneyScroll.getState().progress,
  idle,
});

if (typeof window !== "undefined") {
  useJourneyScroll.subscribe(() => sceneBuilds.catchUp());
}
