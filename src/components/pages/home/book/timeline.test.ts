import { describe, expect, it } from "vitest";
import { BOOK_TIMELINE } from "#/components/pages/home/book/timeline";
import { TIMELINE } from "#/components/pages/home/timeline/tuning";

/** The page (rich-black) and the unfilled marks' colour (gray-slate): globals.css @theme. */
const PAGE = "#19191c";
const SLATE = "#d9d9d9";

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

/** A colour at `alpha` over the page, as it shows. */
const over = (hex: string, alpha: number) => {
  const [r, g, b] = channels(hex).map((c, i) =>
    Math.round(c * alpha + channels(PAGE)[i] * (1 - alpha)),
  );
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
};

/** WCAG's contrast ratio between two colours. */
const contrast = (a: string, b: string) => {
  const luminance = (hex: string) => {
    const [r, g, b] = channels(hex).map((c) => {
      const v = c / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe("the calm book's timeline", () => {
  it("shows its marks at 3:1 or more against the page (WCAG 1.4.11)", () => {
    // The passed chapters, the current one and the fill.
    expect(contrast(BOOK_TIMELINE.customColor, PAGE)).toBeGreaterThanOrEqual(3);
    // The chapters ahead: shown, not hidden.
    expect(BOOK_TIMELINE.upcoming).toBe("dim");
    expect(contrast(over(SLATE, BOOK_TIMELINE.upcomingAlpha), PAGE)).toBeGreaterThanOrEqual(3);
  });

  it("doesn't breathe (WCAG 2.2.2)", () => {
    expect(BOOK_TIMELINE.pulse).toBe(false);
  });

  it("is the journey's in place and shape", () => {
    for (const key of [
      "position",
      "orientation",
      "edge",
      "railLength",
      "railWidth",
      "shape",
    ] as const)
      expect(BOOK_TIMELINE[key], key).toBe(TIMELINE[key]);
    expect(BOOK_TIMELINE.starSize).toBe(TIMELINE.starSize);
    expect(BOOK_TIMELINE.currentSize).toBe(TIMELINE.currentSize);
  });
});
