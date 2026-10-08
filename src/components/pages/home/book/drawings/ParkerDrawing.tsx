import clsx from "clsx";
import { MARK } from "#/components/pages/home/book/dots/marks";
import { LAB_FRAME, LAB_SUN } from "#/components/pages/home/book/dots/shapes/sun";
import SvgStars from "#/components/pages/home/book/drawings/SvgStars";
import { PROBE_SCALE, closest, loops, probe } from "#/components/pages/home/book/drawings/parker";
import { BOOK } from "#/components/pages/home/story/copy";

/** Lines that keep their width however the probe is scaled. */
const THIN = { vectorEffect: "non-scaling-stroke" } as const;

/**
 * The Parker Solar Probe, from its real proportions (three.js/parker/config.ts), in metres:
 * the white heat shield on top facing the Sun, the dark body in its shade with the peach
 * memory card glowing on it, the blue wings swept back, the antennas, and the long boom.
 */
const Probe = () => (
  <>
    <path
      d="M-0.9 0.08 L-2.9 -0.32 M-0.85 0.14 L-2.75 0.52 M0.9 0.08 L2.9 -0.32 M0.85 0.14 L2.75 0.52"
      stroke="#C9CCD2"
      strokeWidth={1}
      fill="none"
      {...THIN}
    />
    <path
      d="M0 1.75 V5.25 M-0.3 4.83 H0.3"
      stroke="#A9AEB6"
      strokeWidth={1.4}
      fill="none"
      {...THIN}
    />
    <rect x={-0.1} y={3.25} width={0.2} height={0.2} fill="#D7D9DD" />
    <rect x={-0.1} y={4.05} width={0.2} height={0.2} fill="#D7D9DD" />
    <rect x={-0.12} y={5.13} width={0.24} height={0.24} fill="#D7D9DD" />
    <path
      d="M0.5 0.84 L1.13 1.74 L1.47 1.6 L0.84 0.7 Z M-0.5 0.84 L-1.13 1.74 L-1.47 1.6 L-0.84 0.7 Z"
      fill="#1E2F55"
      stroke="#A9AEB6"
      strokeWidth={0.8}
      {...THIN}
    />
    <rect x={-0.3} y={0.22} width={0.6} height={0.4} fill="#D7D9DD" opacity={0.75} />
    <path
      d="M-0.6 0.12 L-0.38 0.75 M0.6 0.12 L0.38 0.75 M-0.22 0.12 L-0.16 0.75 M0.22 0.12 L0.16 0.75"
      stroke="#7A7D85"
      strokeWidth={1}
      fill="none"
      {...THIN}
    />
    <path d="M-0.5 0.75 H-0.25 V1.75 H-0.5 Z" fill="#141417" />
    <rect x={-0.25} y={0.75} width={0.5} height={1} fill="#2A2A30" />
    <path d="M0.25 0.75 H0.5 V1.75 H0.25 Z" fill="#1C1C20" />
    <rect
      x={-0.5}
      y={0.75}
      width={1}
      height={1}
      fill="none"
      stroke="#55555E"
      strokeWidth={0.8}
      {...THIN}
    />
    <ellipse cx={0} cy={1.04} rx={0.2} ry={0.15} fill="#D7D9DD" />
    <ellipse cx={0} cy={1.04} rx={0.07} ry={0.05} fill="#8E9198" />
    <circle cx={0} cy={1.46} r={0.4} fill="url(#lab-card-glow)" />
    <rect x={-0.14} y={1.36} width={0.28} height={0.2} rx={0.02} fill="var(--color-peach)" />
    <rect
      x={-1.15}
      y={-0.12}
      width={2.3}
      height={0.24}
      rx={0.12}
      fill="#2A2A2E"
      stroke="#5A5A62"
      strokeWidth={0.6}
      {...THIN}
    />
    <rect x={-1.15} y={-0.12} width={2.3} height={0.11} rx={0.055} fill="#F2F2EE" />
    <rect x={0.86} y={-0.3} width={0.12} height={0.18} fill="#D7D9DD" />
  </>
);

const fixed = (n: number) => +n.toFixed(1);

/**
 * The Lab in the calm book (P27-93): Parker's loops around the Sun, each one closer, the
 * newest in peach with its closest pass marked, and the probe on it. Drawn over the Sun's
 * dots (DotField "sun"), in the same frame; the pointer passes through to them. Its top and
 * bottom fade out, so the loops leave the frame softly.
 */
const ParkerDrawing = () => {
  const near = closest();
  const at = probe();
  return (
    <svg
      viewBox={`0 0 ${LAB_FRAME.w} ${LAB_FRAME.h}`}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 size-full animate-[fade_0.5s_ease-out] [mask-image:linear-gradient(to_bottom,transparent,#000_8%,#000_80%,transparent)]"
    >
      <defs>
        <radialGradient id="lab-card-glow">
          <stop offset="0" stopColor="var(--color-peach)" stopOpacity={0.7} />
          <stop offset="1" stopColor="var(--color-peach)" stopOpacity={0} />
        </radialGradient>
      </defs>
      <SvgStars w={LAB_FRAME.w} h={LAB_FRAME.h} count={60} seed={23} />
      {loops().map((loop, j) => (
        <ellipse
          key={j}
          cx={fixed(loop.cx)}
          cy={loop.cy}
          rx={fixed(loop.rx)}
          ry={fixed(loop.ry)}
          transform={`rotate(${fixed(loop.turn)} ${LAB_SUN.x} ${LAB_SUN.y})`}
          fill="none"
          stroke={loop.newest ? "var(--color-peach)" : "var(--color-light-peach)"}
          strokeOpacity={loop.newest ? 0.9 : +(0.16 + j * 0.08).toFixed(2)}
          strokeWidth={loop.newest ? 1.5 : 1}
        />
      ))}
      <circle cx={fixed(near.x)} cy={fixed(near.y)} r={2.5} fill="var(--color-light-peach)" />
      <line
        className={MARK.line}
        x1={fixed(near.x - 2)}
        y1={fixed(near.y + 5)}
        x2={34}
        y2={fixed(near.y + 70)}
      />
      <text className={clsx(MARK.label, "text-sm")} x={16} y={fixed(near.y + 88)}>
        {BOOK.closest}
      </text>
      <g
        transform={`translate(${fixed(at.x)} ${fixed(at.y)}) rotate(${fixed(at.turn)}) scale(${PROBE_SCALE}) translate(0 -1)`}
      >
        <Probe />
      </g>
      <line
        className={MARK.line}
        x1={fixed(at.x - 18)}
        y1={fixed(at.y + 30)}
        x2={fixed(at.x - 32)}
        y2={fixed(at.y + 56)}
      />
      <text
        className={clsx(MARK.label, "text-sm")}
        x={fixed(at.x - 36)}
        y={fixed(at.y + 70)}
        textAnchor="end"
      >
        {BOOK.probe}
      </text>
    </svg>
  );
};

export default ParkerDrawing;
