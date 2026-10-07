/**
 * The Craft's constellation (P27-91: drawn by the journey's Skills overlay, and by the
 * calm book): the tools I reach for and the things that pull my eye, connected into an
 * organic web with no fixed shape. Two threads, creative (Photography · Drawing · Motion)
 * and engineering (React · TypeScript · Next.js · GSAP), meet at a bridge (Three.js /
 * R3F). In SVG units (a 600 × 420 view box). No imports, so the book reads it without the 3D.
 */
export type ConstellationNode = {
  id: string;
  label: string;
  x: number;
  y: number;
  r: number;
  /** Label vertical offset from the node (negative = above). */
  labelDy: number;
  bridge?: boolean;
};

// Organic layout: creative thread up top, engineering below, the Three.js/R3F bridge in
// the middle where they meet. No recognizable shape.
export const NODES: readonly ConstellationNode[] = [
  { id: "photo", label: "Photography", x: 110, y: 95, r: 5, labelDy: -14 },
  { id: "draw", label: "Drawing", x: 300, y: 58, r: 5, labelDy: -14 },
  { id: "motion", label: "Motion", x: 488, y: 104, r: 5, labelDy: -14 },
  {
    id: "bridge",
    label: "Three.js / R3F",
    x: 300,
    y: 212,
    r: 9,
    labelDy: 26,
    bridge: true,
  },
  { id: "react", label: "React", x: 104, y: 330, r: 5, labelDy: 22 },
  { id: "ts", label: "TypeScript", x: 250, y: 362, r: 5, labelDy: 22 },
  { id: "next", label: "Next.js", x: 410, y: 348, r: 5, labelDy: 22 },
  { id: "gsap", label: "GSAP", x: 522, y: 298, r: 5, labelDy: 22 },
];

// Connections (node id pairs). Two threads, both wired through the bridge, plus
// one thematic cross-link (GSAP ↔ Motion).
export const LINES: readonly (readonly [string, string])[] = [
  ["photo", "draw"],
  ["draw", "motion"], // creative thread
  ["react", "ts"],
  ["ts", "next"],
  ["next", "gsap"], // engineering thread
  ["bridge", "draw"],
  ["bridge", "motion"], // bridge → creative
  ["bridge", "react"],
  ["bridge", "next"], // bridge → engineering
  ["gsap", "motion"], // motion tool ↔ motion craft
];
