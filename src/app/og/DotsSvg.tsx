import type { Dot } from "#/components/pages/home/book/dots/dots.types";

/** Dots as an SVG for next/og: `view` is its viewBox (x, y, width, height), drawn at `size` px. */
const DotsSvg = ({
  dots,
  view,
  width,
  height,
}: {
  dots: readonly Dot[];
  view: readonly number[];
  width: number;
  height: number;
}) => (
  <svg width={width} height={height} viewBox={view.join(" ")}>
    {dots.map((d, i) => (
      <circle key={i} cx={d.x} cy={d.y} r={d.r} fill={d.c} opacity={d.a} />
    ))}
  </svg>
);

export default DotsSvg;
