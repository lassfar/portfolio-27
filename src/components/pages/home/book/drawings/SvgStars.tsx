import { seeded } from "#/components/pages/home/book/dots/patterns";

type Props = {
  /** The drawing's frame (its viewBox). */
  w: number;
  h: number;
  /** How many stars. */
  count: number;
  /** The same seed, the same sky. */
  seed: number;
};

/** A faint sky behind a 2D drawing of the calm book (P27-93): small white stars, seeded. */
const SvgStars = ({ w, h, count, seed }: Props) => {
  const rnd = seeded(seed);
  return (
    <g fill="#fff">
      {Array.from({ length: count }, (_, i) => (
        <circle
          key={i}
          cx={+(rnd() * w).toFixed(1)}
          cy={+(rnd() * h).toFixed(1)}
          r={+(0.4 + rnd() * 0.8).toFixed(2)}
          opacity={+(0.12 + rnd() * 0.4).toFixed(2)}
        />
      ))}
    </g>
  );
};

export default SvgStars;
