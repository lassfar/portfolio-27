/** The page's colour (rich-black, globals.css @theme). */
const PAGE = [25, 25, 28];

/** A CSS colour as the browser paints it, in any syntax (oklab, color(srgb …), color-mix…): RGBA 0–255. */
const rgba = (css: string) => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  return [...ctx.getImageData(0, 0, 1, 1).data];
};

const luminance = (rgb: number[]) => {
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * WCAG's contrast ratio of a colour (as painted over the page, if see-through) against the
 * page (P27-93): for a play test to pin 1.4.3 (text, 4.5:1) or 1.4.11 (a control, 3:1).
 */
export const contrastOnPage = (css: string) => {
  const [r, g, b, a] = rgba(css);
  const painted = [r, g, b].map((c, i) => c * (a / 255) + PAGE[i] * (1 - a / 255));
  const [hi, lo] = [luminance(painted), luminance(PAGE)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
