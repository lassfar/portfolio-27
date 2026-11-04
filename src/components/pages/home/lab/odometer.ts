/** The number's rolling digits (P27-118): hundreds, tens, ones, tenths. */
export const DRUMS = 4;

/**
 * A distance ("147", "24.1", "6.1": millionKmFromSun) as the digit each place shows, the leading
 * ones blank (null) so a small number doesn't read "006.1".
 */
export function odometerDigits(km: string): (number | null)[] {
  const [whole, tenth = "0"] = km.split(".");
  const digits = [...whole.padStart(DRUMS - 1, " "), tenth];
  return digits.map((c) => (c === " " ? null : Number(c)));
}

/** How many of the records (farthest first) a distance has reached. */
export function stepsReached(km: string, steps: readonly string[]): number {
  return steps.filter((step) => Number(km) <= Number(step)).length;
}
