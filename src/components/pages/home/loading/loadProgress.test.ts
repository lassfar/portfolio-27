import { describe, expect, it } from "vitest";
import { LOAD_STEPS, loadPercent, loadProgress, type LoadStep } from "./loadProgress";

describe("loadProgress", () => {
  const all = Object.keys(LOAD_STEPS) as LoadStep[];

  it("is full once every step is done, and only then", () => {
    expect(loadProgress(all)).toBe(1);
    for (const left of all) expect(loadProgress(all.filter((s) => s !== left))).toBeLessThan(1);
  });

  it("starts empty", () => {
    expect(loadProgress([])).toBe(0);
  });

  it("adds the steps done, in any order, each once", () => {
    expect(loadProgress(["scene", "fonts"])).toBe(loadProgress(["fonts", "scene"]));
    expect(loadProgress(["fonts", "fonts"])).toBe(LOAD_STEPS.fonts);
  });

  it("says it as a whole percentage", () => {
    expect(loadPercent(loadProgress(["fonts", "journey"]))).toBe(40);
    expect(loadPercent(1)).toBe(100);
  });
});
