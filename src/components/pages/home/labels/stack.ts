/** A label's box on screen (px): its centre `cx`, its top-left corner, its size. */
export type LabelBox = {
  cx: number;
  left: number;
  top: number;
  w: number;
  h: number;
  /** Kept in place before the others (e.g. the label riding Parker's tip, which moves every frame). */
  pinned?: boolean;
};

/** Pinned first, then bottom-most first. */
const order = (a: LabelBox, b: LabelBox) =>
  !!a.pinned === !!b.pinned ? b.top - a.top : a.pinned ? -1 : 1;

/**
 * Stacks the scene's labels that would overlap (the Earth's places, Parker's journey):
 * keeps the pinned ones, then the lowest, where they are, and lifts each label that
 * collides with one already placed to just above it (`gap` px apart) — again, until it
 * collides with none. Moves `top` only, and sorts `boxes` in place (it runs every frame:
 * nothing is allocated).
 */
export function stackLabels(boxes: LabelBox[], gap: number): void {
  boxes.sort(order);
  for (let i = 1; i < boxes.length; i++) {
    const cur = boxes[i];
    let guard = 0;
    let moved = true;
    while (moved && guard++ < boxes.length) {
      moved = false;
      for (let j = 0; j < i; j++) {
        const o = boxes[j];
        const hOver = Math.abs(cur.cx - o.cx) < (cur.w + o.w) / 2 + gap;
        const vOver = cur.top < o.top + o.h + gap && cur.top + cur.h + gap > o.top;
        if (hOver && vOver) {
          cur.top = o.top - cur.h - gap;
          moved = true;
        }
      }
    }
  }
}
