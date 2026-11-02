import { useId, type CSSProperties } from "react";

/** The track's dots (px in its 80 × 38 box), and how high each rides the wave with motion. */
const TRACK_DOTS = Array.from({ length: 9 }, (_, i) => ({
  cx: 13 + i * 6.8,
  wave: `${(Math.sin(i * 1.1) * 5).toFixed(2)}px`,
}));

/**
 * The Reduce motion switch's drawing (P27-114): a softly sunken track of dots, glowing like
 * embers, and a raised knob with a peach core. With motion the knob is on the right and the dots
 * ride a wave; in calm (the switch on) the knob is on the left and the dots lie flat and dim. It
 * follows the switch's own state (`aria-checked`), styled in globals.css (`motion-track`): with
 * motion the knob slides and the wave settles a little on hover or focus; in calm it jumps
 * (WCAG 2.3.3). Decorative: the switch names it.
 */
const MotionTrack = () => {
  const shadow = useId();
  return (
    <svg viewBox="0 0 80 38" aria-hidden="true" focusable="false" className="motion-track">
      <defs>
        <filter id={shadow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <rect x="1" y="1" width="78" height="36" rx="18" className="motion-track__well" />
      <rect x="2.5" y="2.5" width="75" height="33" rx="16.5" className="motion-track__rail" />
      {TRACK_DOTS.map(({ cx, wave }) => (
        <circle
          key={cx}
          cx={cx}
          cy="19"
          r="1.6"
          className="motion-track__dot"
          style={{ "--wave": wave } as CSSProperties}
        />
      ))}
      <g className="motion-track__knob">
        <circle cx="19" cy="22" r="12" filter={`url(#${shadow})`} className="fill-black/60" />
        <circle cx="19" cy="19" r="12" className="motion-track__cap" />
        <circle cx="19" cy="19" r="5" className="fill-peach" />
      </g>
    </svg>
  );
};

export default MotionTrack;
