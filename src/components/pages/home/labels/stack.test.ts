import { describe, expect, it } from "vitest";
import { type LabelBox, stackLabels } from "./stack";

const GAP = 6;
const box = (cx: number, top: number, w = 100, h = 20, pinned = false): LabelBox => ({
  cx,
  left: cx - w / 2,
  top,
  w,
  h,
  pinned,
});

describe("stacking the scene's labels", () => {
  it("leaves labels that don't overlap where they are", () => {
    const a = box(100, 100);
    const b = box(300, 100); // side by side, clear of each other
    const c = box(100, 200); // under the first
    stackLabels([a, b, c], GAP);
    expect([a.top, b.top, c.top]).toEqual([100, 100, 200]);
  });

  it("lifts the higher of two overlapping labels just above the lower one", () => {
    const low = box(100, 110);
    const high = box(130, 100);
    stackLabels([high, low], GAP);
    expect(low.top).toBe(110);
    expect(high.top).toBe(110 - 20 - GAP);
  });

  it("stacks a chain of three into a column", () => {
    const boxes = [box(100, 100), box(110, 104), box(90, 108)];
    stackLabels(boxes, GAP);
    const tops = boxes.map((b) => b.top).sort((x, y) => y - x);
    expect(tops).toEqual([108, 108 - 26, 108 - 52]);
  });

  it("keeps a pinned label in place and moves the others around it", () => {
    const tip = box(100, 90, 100, 20, true);
    const other = box(100, 100);
    stackLabels([other, tip], GAP);
    expect(tip.top).toBe(90);
    expect(other.top).toBe(90 - 20 - GAP);
  });

  it("only counts labels as overlapping when they're closer than their half-widths and the gap", () => {
    const a = box(100, 100);
    const touching = box(100 + 100 + GAP, 100); // exactly `gap` apart: clear
    stackLabels([a, touching], GAP);
    expect(touching.top).toBe(100);
    const near = box(100 + 100 + GAP - 1, 100);
    stackLabels([a, near], GAP);
    expect(Math.min(a.top, near.top)).toBe(100 - 20 - GAP);
  });

  it("changes nothing when run again on its own result", () => {
    const boxes = [box(100, 100), box(110, 104), box(90, 108), box(400, 50)];
    stackLabels(boxes, GAP);
    const once = boxes.map((b) => b.top);
    stackLabels(boxes, GAP);
    expect(boxes.map((b) => b.top)).toEqual(once);
  });
});
