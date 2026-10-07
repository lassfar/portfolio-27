import { describe, expect, it } from "vitest";
import {
  createQualityController,
  QUALITY_TUNING,
  type QualityController,
} from "./qualityController";
import { startStep } from "./quality";

const LOWEST = 4;
const T = QUALITY_TUNING;

/** Feed frames at `fps` for `seconds` from `from` (ms); returns the clock after, and every change. */
function run(controller: QualityController, fps: number, seconds: number, from: number) {
  const frameMs = 1000 / fps;
  const changes: { at: number; step: number }[] = [];
  let now = from;
  for (let i = 0; i < Math.round(seconds * fps); i++) {
    now += frameMs;
    const next = controller.sample(frameMs, now);
    if (next !== null) changes.push({ at: now, step: next });
  }
  return { now, changes };
}

describe("the quality controller", () => {
  it("ignores the load's first seconds", () => {
    const c = createQualityController(0, LOWEST, 0);
    const { changes } = run(c, 20, (T.startDelayMs - 100) / 1000, 0);
    expect(changes).toEqual([]);
  });

  it("steps down after a second under the target", () => {
    const c = createQualityController(0, LOWEST, 0);
    const { changes } = run(c, 30, (T.startDelayMs + T.downWindowMs + 200) / 1000, 0);
    expect(changes).toHaveLength(1);
    expect(changes[0].step).toBe(1);
    expect(changes[0].at).toBeGreaterThanOrEqual(T.startDelayMs + T.downWindowMs * 0.9);
    expect(c.fps).toBeCloseTo(30, 0);
  });

  it("lets a change settle before judging again, one step at a time", () => {
    const c = createQualityController(0, LOWEST, 0);
    const { changes } = run(c, 30, 12, 0);
    const gaps = changes.slice(1).map((ch, i) => ch.at - changes[i].at);
    gaps.forEach((gap) => expect(gap).toBeGreaterThanOrEqual(T.settleMs + T.downWindowMs * 0.9));
    changes.forEach((ch, i) => expect(ch.step).toBe(i + 1));
  });

  it("never goes below the lowest step", () => {
    const c = createQualityController(0, LOWEST, 0);
    run(c, 10, 60, 0);
    expect(c.step).toBe(LOWEST);
  });

  it("holds at 60 FPS", () => {
    const c = createQualityController(0, LOWEST, 0);
    const { changes } = run(c, 60, 30, 0);
    expect(changes).toEqual([]);
  });

  it("skips one-off hitches and hidden-tab gaps", () => {
    const c = createQualityController(0, LOWEST, 0);
    let { now } = run(c, 60, 4, 0);
    expect(c.sample(T.maxFrameMs + 50, (now += T.maxFrameMs + 50))).toBeNull();
    const after = run(c, 60, 2, now);
    expect(after.changes).toEqual([]);
  });

  it("steps back up only after several seconds of headroom", () => {
    const c = createQualityController(2, LOWEST, 0);
    const early = run(c, 60, (T.startDelayMs + T.upWindowMs * 0.8) / 1000, 0);
    expect(early.changes).toEqual([]);
    const later = run(c, 60, 2, early.now);
    expect(later.changes.map((ch) => ch.step)).toEqual([1]);
  });

  it("stops going up after flip-flopping", () => {
    // Fast enough at step 1, too slow at step 0: it would bounce between them forever.
    const c = createQualityController(1, LOWEST, 0);
    let now = 0;
    let ups = 0;
    for (let i = 0; i < 120 * 60; i++) {
      const frameMs = 1000 / (c.step === 0 ? 40 : 60);
      now += frameMs;
      if (c.sample(frameMs, now) === 0) ups++;
    }
    expect(ups).toBe(T.maxFlips);
    expect(c.step).toBe(1);
  });
});

describe("the starting step, from the GPU's name", () => {
  it.each([
    ["ANGLE (Intel, Intel(R) Iris(R) Xe Graphics (0x0000A7A1) Direct3D11 vs_5_0 ps_5_0, D3D11)", 1],
    ["ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)", 1],
    ["ANGLE (AMD, AMD Radeon(TM) Graphics (0x00001638) Direct3D11 vs_5_0 ps_5_0, D3D11)", 1],
    ["Mali-G78 MC24", 1],
    ["Adreno (TM) 740", 1],
    ["ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)", 0],
    ["ANGLE (Apple, ANGLE Metal Renderer: Apple M2 Pro, Unspecified Version)", 0],
    ["Apple GPU", 0],
    ["ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)", 4],
  ])("%s → step %i", (renderer, step) => {
    expect(startStep(renderer)).toBe(step);
  });
});
