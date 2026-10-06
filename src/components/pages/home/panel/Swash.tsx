import clsx from "clsx";
import type { CSSProperties } from "react";

/**
 * The hand-drawn swash under a panel's title (P27-80): one pen stroke with a small loop
 * at its end, drawing itself in as the panel opens (its path's length is 1, so a dash
 * of 1 hides it at offset 1 and shows it at 0). `className` sizes it.
 */
const Swash = ({ className, style }: { className?: string; style?: CSSProperties }) => (
  <svg
    viewBox="0 0 300 30"
    aria-hidden="true"
    className={clsx("mt-0.5 block max-w-full overflow-visible text-peach", className)}
    style={style}
  >
    <path
      pathLength={1}
      d="M10 20 C 62 8, 118 28, 176 17 C 212 10, 244 8, 262 15 C 276 20, 274 28, 264 27 C 254 26, 258 12, 292 9"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={1}
      className="opacity-85 motion-safe:animate-draw"
    />
  </svg>
);

export default Swash;
