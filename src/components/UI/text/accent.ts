/** A run of a text, accented or not. */
export type AccentPart = { text: string; accent: boolean };

/**
 * A text split into its plain and accented runs: the accented words are written between
 * asterisks ("Back to *London*"). Shared by the story's subtitles and the panels' titles.
 */
export function accentParts(text: string): AccentPart[] {
  return text
    .split("*")
    .map((run, i) => ({ text: run, accent: i % 2 === 1 }))
    .filter((part) => part.text.length > 0);
}

/** The text without its accent marks (e.g. for an accessible name). */
export const plainText = (text: string) => text.replaceAll("*", "");
