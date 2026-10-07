import { readFileSync } from "node:fs";
import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { EARTH_ELEMENTS, orbitRadius } from "#/components/three.js/solar/config";
import {
  buildJourney,
  closestAt,
  journeyPoint,
  journeyRadius,
  journeyTipAt,
  millionKmFromSun,
  pointsUpTo,
  type JourneyData,
  type JourneyLine,
} from "./journey";
import { PARKER_ORBIT, parkerOffset } from "./orbit";

const data: JourneyData = JSON.parse(
  readFileSync(new URL("../../../../public/data/parker-journey.json", import.meta.url), "utf8"),
);

const build = (nowJD: number): JourneyLine => {
  const steps = buildJourney(data, nowJD);
  let step = steps.next();
  while (!step.done) step = steps.next();
  return step.value;
};

describe("Parker's journey line", () => {
  it("meets the live orbit where the recording ends", () => {
    const n = data.days.length - 1;
    const p = data.points;
    const recorded = journeyPoint(p[n * 3], p[n * 3 + 1], p[n * 3 + 2], new Vector3());
    const live = parkerOffset(new Vector3(), data.endJD);
    expect(recorded.distanceTo(live)).toBeLessThan(0.02);
  });

  it("maps distances continuously at today's farthest point, always growing outward", () => {
    const Q = PARKER_ORBIT.Q;
    expect(journeyRadius(Q - 1e-9)).toBeCloseTo(journeyRadius(Q + 1e-9), 6);
    let last = -Infinity;
    for (let au = 0.04; au < 1.1; au += 0.005) {
      const r = journeyRadius(au);
      expect(r).toBeGreaterThan(last);
      last = r;
    }
  });

  it("starts on the Earth's orbit and meets Venus's orbit at each of its 7 flybys", () => {
    const v = new Vector3();
    journeyPoint(data.points[0], data.points[1], data.points[2], v);
    expect(Math.abs(v.length() - orbitRadius(EARTH_ELEMENTS.au))).toBeLessThan(0.15);
    expect(data.flybys).toHaveLength(7);
    for (const { at } of data.flybys) {
      expect(
        Math.abs(journeyPoint(at[0], at[1], at[2], v).length() - orbitRadius(0.723)),
      ).toBeLessThan(0.1);
    }
  });

  it("builds the whole line in order, ending at the probe today", () => {
    const now = data.endJD + 30;
    const line = build(now);
    expect(line.count).toBe(data.days.length + 60);
    for (let i = 1; i < line.count; i++)
      expect(line.days[i]).toBeGreaterThanOrEqual(line.days[i - 1]);
    const end = new Vector3().fromArray(line.positions, (line.count - 1) * 3);
    expect(end.distanceTo(parkerOffset(new Vector3(), now))).toBeLessThan(1e-4);
    expect(pointsUpTo(line, -1)).toBe(0);
    expect(pointsUpTo(line, line.today)).toBe(line.count);
  });

  it("moves its tip smoothly from the launch to the probe today", () => {
    const now = data.endJD + 30;
    const line = build(now);
    const tip = new Vector3();
    const start = new Vector3().fromArray(line.positions, 0);
    const end = new Vector3().fromArray(line.positions, (line.count - 1) * 3);
    journeyTipAt(line, 0, tip);
    expect(tip.distanceTo(start)).toBeLessThan(1e-6);
    expect(journeyTipAt(line, line.today, tip)).toBe(line.count);
    expect(tip.distanceTo(end)).toBeLessThan(1e-6);
    // No jumps: its biggest move over a step in time shrinks with the step.
    const biggestMove = (step: number) => {
      const last = new Vector3();
      let most = 0;
      journeyTipAt(line, 0, last);
      for (let day = step; day <= line.today; day += step) {
        most = Math.max(most, journeyTipAt(line, day, tip) && tip.distanceTo(last));
        last.copy(tip);
      }
      return most;
    };
    expect(biggestMove(0.02)).toBeLessThan(biggestMove(0.2) / 5);
  });

  it("gets closer to the Sun loop by loop, never farther, as NASA reports", () => {
    const line = build(data.endJD + 30);
    let last = Infinity;
    for (let day = 0; day <= line.today; day += 0.25) {
      const c = closestAt(line, day);
      expect(c).toBeLessThanOrEqual(last);
      last = c;
    }
    // From the surface: ~151 million km at the launch (the Earth), 24.1 after the first
    // loop, 6.1 — its record — since Dec 2024.
    expect(millionKmFromSun(closestAt(line, 0))).toBe("150");
    expect(millionKmFromSun(closestAt(line, data.perihelia[0].day))).toBe("24.1");
    expect(millionKmFromSun(closestAt(line, line.today))).toBe("6.1");
    expect(data.perihelia).toHaveLength(29);
  });
});
