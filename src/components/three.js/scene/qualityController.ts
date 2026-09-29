/**
 * The automatic quality tiers' decisions (P27-78), kept pure so they're unit-tested:
 * fed each frame's time, it steps the quality DOWN quickly when the last second falls
 * under the target, and back UP slowly after several seconds of headroom. It stops
 * going up for the visit once it has flip-flopped a few times, so it never flickers.
 */

/** Mutable: tune live (like STORY_MOTION). Times in ms. */
export const QUALITY_TUNING = {
  downBelowFps: 55, // step down when the last `downWindowMs` average under this…
  downWindowMs: 1000,
  upAboveFps: 58, // …step up when the last `upWindowMs` average at least this
  upWindowMs: 5000,
  settleMs: 1500, // frames right after a change don't count (its buffers re-allocate)
  startDelayMs: 3000, // nor the load's first seconds (compiles, builds)
  maxFrameMs: 250, // longer gaps (a hidden tab, a one-off hitch) are skipped
  maxFlips: 3, // after this many "down soon after an up", stop going up
};

export type QualityTuning = typeof QUALITY_TUNING;

export type QualityController = {
  readonly step: number;
  /** The average FPS behind the last change. */
  readonly fps: number;
  /** Feed one frame (its time, and the clock now); returns the new step when it changes. */
  sample(frameMs: number, now: number): number | null;
};

type Frame = { at: number; ms: number };

export function createQualityController(
  start: number,
  lowest: number,
  startedAt: number,
  tuning: QualityTuning = QUALITY_TUNING,
): QualityController {
  let step = start;
  let fps = 0;
  let frames: Frame[] = []; // oldest first, within the up window
  let countFrom = startedAt + tuning.startDelayMs;
  let lastUpAt = -Infinity;
  let flips = 0;

  // The average FPS over the last `windowMs`, once frames cover (most of) it.
  const averageFps = (windowMs: number, now: number): number | null => {
    if (!frames.length || now - frames[0].at < windowMs * 0.9) return null;
    let total = 0;
    let count = 0;
    for (let i = frames.length - 1; i >= 0 && frames[i].at >= now - windowMs; i--) {
      total += frames[i].ms;
      count++;
    }
    return total > 0 ? (count * 1000) / total : null;
  };

  const change = (next: number, measured: number, now: number) => {
    step = next;
    fps = measured;
    frames = [];
    countFrom = now + tuning.settleMs;
    return step;
  };

  return {
    get step() {
      return step;
    },
    get fps() {
      return fps;
    },
    sample(frameMs, now) {
      if (now < countFrom || frameMs <= 0 || frameMs > tuning.maxFrameMs) return null;
      frames.push({ at: now, ms: frameMs });
      while (frames.length && frames[0].at < now - tuning.upWindowMs) frames.shift();

      const recent = averageFps(tuning.downWindowMs, now);
      if (recent !== null && recent < tuning.downBelowFps && step < lowest) {
        if (now - lastUpAt < tuning.upWindowMs * 2) flips++;
        return change(step + 1, recent, now);
      }
      if (step > 0 && flips < tuning.maxFlips) {
        const steady = averageFps(tuning.upWindowMs, now);
        if (steady !== null && steady >= tuning.upAboveFps) {
          lastUpAt = now;
          return change(step - 1, steady, now);
        }
      }
      return null;
    },
  };
}
