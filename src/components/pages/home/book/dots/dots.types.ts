/** The calm book's dotted shapes (P27-93), one per figure. */
export const SHAPE_NAMES = ["star", "saturn", "earth", "sun", "galaxy"] as const;

export type ShapeName = (typeof SHAPE_NAMES)[number];

/** One dot at rest: where it sits, its size, its colour and how bright it is (0–1). */
export type Dot = { x: number; y: number; r: number; c: string; a: number };

/** A label drawn over the dots (SVG): a pin's ring, its leader line, its name. */
export type DotMark =
  | { kind: "ring"; x: number; y: number; r: number }
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number }
  | { kind: "label"; x: number; y: number; text: string; anchor: "start" | "end" };

/** What a shape draws with. */
export type Pen = {
  dot: (x: number, y: number, r: number, c: string, a: number) => void;
  mark: (mark: DotMark) => void;
};

/** What a shape is drawn from: the figure's size in CSS px, and its seeded randomness. */
export type ShapeFrame = {
  w: number;
  h: number;
  rnd: () => number;
  /** The screen's height: the cover's star is sized from it, not from the (taller) cover. */
  viewportHeight: number;
  /** The Earth's land map: whether a point (degrees) is land. */
  isLand: (lat: number, lon: number) => boolean;
};

/** A shape: pure, so the same size always gives the same dots. */
export type Shape = (pen: Pen, frame: ShapeFrame) => void;
