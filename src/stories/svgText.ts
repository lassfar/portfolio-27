/** The size an SVG text shows at on screen (px): its size in the drawing's units × the drawing's scale (P27-95). */
export const renderedPx = (text: SVGTextElement) => {
  const svg = text.ownerSVGElement!;
  const { width, height } = svg.getBoundingClientRect();
  const box = svg.viewBox.baseVal;
  return (
    parseFloat(getComputedStyle(text).fontSize) * Math.min(width / box.width, height / box.height)
  );
};

/** Whether two SVG texts overlap (their boxes, in the drawing's units). */
export const overlap = (a: SVGTextElement, b: SVGTextElement) => {
  const p = a.getBBox();
  const q = b.getBBox();
  return p.x < q.x + q.width && q.x < p.x + p.width && p.y < q.y + q.height && q.y < p.y + p.height;
};
