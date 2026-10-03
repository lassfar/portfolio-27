// Scratch arrays, reused every call (P27-78): the camera rig evaluates this every frame.
const slopes: number[] = [];
const tangents: number[] = [];

/**
 * A smooth curve through the points (xs, ys) that never overshoots them (monotone
 * cubic, Fritsch–Carlson): its slope is continuous, and 0 at both ends — so a motion
 * driven by it speeds up and slows down gently between keyframes, and starts and stops
 * at rest.
 */
export function monotoneCurve(x: number, xs: readonly number[], ys: readonly number[]): number {
  const n = xs.length;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[n - 1]) return ys[n - 1];
  const d = slopes;
  const m = tangents;
  d.length = n - 1;
  m.length = n;
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = 0;
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  m[n - 1] = 0;
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
