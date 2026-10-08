import { LINES, NODES } from "#/components/pages/home/skills/constellation";
import SvgStars from "#/components/pages/home/book/drawings/SvgStars";

const nodeOf = Object.fromEntries(NODES.map((n) => [n.id, n]));

/**
 * The Craft in the calm book (P27-93): the site's constellation as it is (Skills.tsx, the same
 * NODES and LINES), drawn still, over a faint sky. A node glows when the pointer touches it:
 * its halo fades in, its name turns white; nothing grows (WCAG 2.3.3). Not the journey's own
 * SVG: that one carries the hooks its scroll assembly animates.
 */
const CraftDrawing = () => (
  <svg viewBox="0 0 600 420" aria-hidden="true" className="absolute inset-0 size-full">
    <SvgStars w={600} h={420} count={70} seed={11} />
    <g stroke="var(--color-baby-blue)" strokeOpacity={0.4} strokeWidth={1}>
      {LINES.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={nodeOf[a].x}
          y1={nodeOf[a].y}
          x2={nodeOf[b].x}
          y2={nodeOf[b].y}
        />
      ))}
    </g>
    {NODES.map((n) => (
      <g key={n.id} className="group">
        {/* Easier to touch than the dot itself. */}
        <circle cx={n.x} cy={n.y} r={n.r + 12} fill="transparent" />
        {/* The hub's halo, always there; any node's glow, on touch. */}
        {n.bridge && (
          <circle cx={n.x} cy={n.y} r={n.r + 9} fill="var(--color-peach)" opacity={0.12} />
        )}
        <circle
          cx={n.x}
          cy={n.y}
          r={n.r + 8}
          fill="var(--color-peach)"
          className="opacity-0 transition-opacity duration-300 group-hover:opacity-30"
        />
        <circle cx={n.x} cy={n.y} r={n.r} fill="var(--color-peach)" />
        <text
          x={n.x}
          y={n.y + n.labelDy}
          textAnchor="middle"
          fontSize={n.bridge ? 13 : 11.5}
          className="fill-light-baby-blue font-sans transition-[fill] duration-300 group-hover:fill-white"
        >
          {n.label}
        </text>
      </g>
    ))}
  </svg>
);

export default CraftDrawing;
