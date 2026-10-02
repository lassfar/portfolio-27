import { describe, expect, it } from "vitest";
import { BUILD_TUNING, createBuildQueue, type BuildEnv } from "./buildQueue";

/** A fake browser: a clock that each step advances, a settable progress, manual idle slices. */
function fakeEnv() {
  const state = { clock: 0, mp: 0, slices: [] as ((budgetMs: number) => void)[] };
  const env: BuildEnv = {
    now: () => state.clock,
    mp: () => state.mp,
    idle: (run) => state.slices.push(run),
  };
  const idleSlice = (budgetMs = 8) => state.slices.shift()?.(budgetMs);
  return { state, env, idleSlice };
}

/** A job of `steps` steps, each costing `stepMs` on the fake clock; records when it's done. */
function job(
  name: string,
  neededAt: number,
  steps: number,
  state: { clock: number },
  done: string[],
  stepMs = 1,
) {
  function* work() {
    for (let i = 0; i < steps; i++) {
      state.clock += stepMs;
      yield;
    }
  }
  return { name, neededAt, steps: work(), onDone: () => done.push(name) };
}

describe("the build queue", () => {
  it("builds in story order, in idle slices within their budget", () => {
    const { state, env, idleSlice } = fakeEnv();
    const done: string[] = [];
    const q = createBuildQueue(env);
    q.add(job("galaxy", 0.75, 20, state, done));
    q.add(job("saturn", 0.03, 5, state, done));
    q.add(job("earth", 0.26, 5, state, done));
    expect(q.pending).toEqual(["saturn", "earth", "galaxy"]);

    const before = state.clock;
    idleSlice(8);
    expect(state.clock - before).toBeLessThanOrEqual(8);
    expect(done).toEqual(["saturn"]);

    while (q.pending.length) idleSlice(8);
    expect(done).toEqual(["saturn", "earth", "galaxy"]);
  });

  it("finishes a job at once when the journey is about to reach it", () => {
    const { state, env } = fakeEnv();
    const done: string[] = [];
    const q = createBuildQueue(env);
    q.add(job("earth", 0.26, 50, state, done));
    q.add(job("galaxy", 0.75, 50, state, done));
    state.mp = 0.26 - BUILD_TUNING.aheadMp;
    q.catchUp();
    expect(done).toEqual(["earth"]);
    expect(q.pending).toEqual(["galaxy"]);
  });

  it("finishes a job at once when it's added already due (a reload mid-page)", () => {
    const { state, env } = fakeEnv();
    const done: string[] = [];
    const q = createBuildQueue(env);
    state.mp = 0.5;
    q.add(job("saturn", 0.03, 10, state, done));
    expect(done).toEqual(["saturn"]);
    expect(q.pending).toEqual([]);
  });

  it("drops a cancelled job", () => {
    const { state, env, idleSlice } = fakeEnv();
    const done: string[] = [];
    const q = createBuildQueue(env);
    const cancel = q.add(job("saturn", 0.03, 5, state, done));
    cancel();
    idleSlice();
    expect(done).toEqual([]);
    expect(q.pending).toEqual([]);
  });
});
