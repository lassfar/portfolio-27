/**
 * A queue for the scene's heavy builds (P27-78). Each job is a generator that does its
 * work in small steps; the queue runs them in story order while the browser is idle,
 * so the page never freezes building things it only shows much later.
 *
 * Just-in-time: a job whose object the journey is about to reach (`aheadMp` before it
 * shows), or has already reached (a reload mid-page, a jump), is finished at once.
 *
 * Pure (the clock, the journey's progress and idle time are passed in), so it's
 * unit-tested; `sceneBuilds` is the scene's instance.
 */

export type BuildJob = {
  name: string;
  /** The journey's master progress (mp) at which its object first shows. */
  neededAt: number;
  /** The work, in small steps: it may pause at each `yield`. */
  steps: Iterator<unknown>;
  /** Called once the work is done. */
  onDone: () => void;
};

export type BuildEnv = {
  /** The clock, in ms. */
  now: () => number;
  /** The journey's master progress now. */
  mp: () => number;
  /** Ask for idle time: `run(budgetMs)` is called when the browser has some. */
  idle: (run: (budgetMs: number) => void) => void;
};

export const BUILD_TUNING = {
  aheadMp: 0.02, // finish a job this far before its object shows (~128 vh of scroll)
};

export type BuildQueue = {
  /** Queue a job (or finish it at once if it's already due). Returns its cancel. */
  add: (job: BuildJob) => () => void;
  /** Finish every job the journey is about to reach. */
  catchUp: () => void;
  /** The names of the jobs still waiting, in story order. */
  readonly pending: readonly string[];
};

const drain = (job: BuildJob) => {
  while (!job.steps.next().done) {
    // (each step runs until it yields)
  }
  job.onDone();
};

export function createBuildQueue(env: BuildEnv, tuning = BUILD_TUNING): BuildQueue {
  const jobs: BuildJob[] = []; // story order
  let requested = false;

  const due = (job: BuildJob) => env.mp() >= job.neededAt - tuning.aheadMp;
  const remove = (job: BuildJob) => {
    const i = jobs.indexOf(job);
    if (i >= 0) jobs.splice(i, 1);
  };

  const request = () => {
    if (requested || !jobs.length) return;
    requested = true;
    env.idle(run);
  };

  // One idle slice: step through the jobs, in order, until the budget is spent.
  function run(budgetMs: number) {
    requested = false;
    const end = env.now() + budgetMs;
    while (jobs.length && env.now() < end) {
      const job = jobs[0];
      if (job.steps.next().done) {
        jobs.shift();
        job.onDone();
      }
    }
    request();
  }

  return {
    add(job) {
      if (due(job)) {
        drain(job);
        return () => {};
      }
      const at = jobs.findIndex((j) => j.neededAt > job.neededAt);
      jobs.splice(at < 0 ? jobs.length : at, 0, job);
      request();
      return () => remove(job);
    },
    catchUp() {
      for (const job of [...jobs]) {
        if (!due(job)) continue;
        remove(job);
        drain(job);
      }
    },
    get pending() {
      return jobs.map((j) => j.name);
    },
  };
}
