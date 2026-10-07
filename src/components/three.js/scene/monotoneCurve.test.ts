import { describe, expect, it } from "vitest";
import { monotoneCurve } from "./monotoneCurve";

/** The curve as it was before P27-78 (fresh arrays every call): the reference. */
function original(x: number, xs: readonly number[], ys: readonly number[]): number {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m: number[] = [0];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2);
  m.push(0);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i];
    const b = m[i + 1] / d[i];
    const s2 = a * a + b * b;
    if (s2 > 9) {
      const k = 3 / Math.sqrt(s2);
      m[i] = k * a * d[i];
      m[i + 1] = k * b * d[i];
    }
  }
  let k = 0;
  while (x > xs[k + 1]) k++;
  const h = xs[k + 1] - xs[k];
  const t = (x - xs[k]) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * ys[k] +
    (t3 - 2 * t2 + t) * h * m[k] +
    (-2 * t3 + 3 * t2) * ys[k + 1] +
    (t3 - t2) * h * m[k + 1]
  );
}

describe("monotoneCurve (reused scratch arrays)", () => {
  it("returns exactly what the original did, across key sets of different sizes", () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let trial = 0; trial < 300; trial++) {
      const n = 2 + Math.floor(rnd() * 6);
      const xs = Array.from({ length: n }, (_, i) => i + rnd() * 0.9);
      const ys = Array.from({ length: n }, () => rnd() * 10 - 5);
      for (let j = 0; j < 20; j++) {
        const x = xs[0] - 0.5 + rnd() * (xs[n - 1] - xs[0] + 1);
        expect(monotoneCurve(x, xs, ys)).toBe(original(x, xs, ys));
      }
    }
  });
});
