/** The odometer's drums (P27-118): hundreds, tens, ones, tenths. */
export const DRUMS = 4;

/**
 * A distance ("147", "24.1", "6.1": millionKmFromSun) as the digit each drum shows, the leading
 * ones blank (null) so a small number doesn't read "006.1".
 */
export function odometerDigits(km: string): (number | null)[] {
  const [whole, tenth = "0"] = km.split(".");
  const digits = [...whole.padStart(DRUMS - 1, " "), tenth];
  return digits.map((c) => (c === " " ? null : Number(c)));
}
