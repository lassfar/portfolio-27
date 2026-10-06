import clsx from "clsx";
import { pointerLight } from "#/components/UI/glass/pointerLight";
import type { GlowCardProps, GlowCardSize } from "#/components/UI/cards/card.types";

const RADIUS: Record<GlowCardSize, string> = {
  md: "rounded-2xl",
  sm: "rounded-xl",
};

/** Behind the card, 24px past its edges (`-inset-6`): hence the pointer + 24px. */
const GLOW =
  "pointer-events-none absolute -inset-6 -z-1 rounded-4xl bg-radial-[170px_circle_at_calc(var(--mx,50%)_+_24px)_calc(var(--my,50%)_+_24px)] from-peach/62 via-dark-peach/20 via-45% to-transparent to-72% opacity-0 blur-lg transition-opacity duration-500 ease-out-quint group-hover/card:opacity-100 group-focus-visible/card:opacity-100";
/** A soft light over the image, at the pointer. */
const HIGHLIGHT =
  "pointer-events-none absolute inset-0 z-1 bg-radial-[220px_circle_at_var(--mx,50%)_var(--my,-30%)] from-white/20 to-transparent to-60% opacity-0 mix-blend-screen transition-opacity duration-500 ease-out-quint group-hover/card:opacity-100 group-focus-visible/card:opacity-100";
/** The edge: a faint ring, lit (top highlight + peach ring) on hover. */
const EDGE =
  "pointer-events-none absolute inset-0 z-3 rounded-[inherit] inset-ring inset-ring-white/6 transition-shadow duration-500 ease-out-quint group-hover/card:inset-shadow-edge group-hover/card:inset-ring-peach/50 group-focus-visible/card:inset-shadow-edge group-focus-visible/card:inset-ring-peach/50";

/**
 * A card with the liquid-glass hover (Storybook: UI/GlowCard, P27-80): it lifts (no
 * scale), a blurred peach glow behind it and a soft light over it follow the pointer, and
 * its edge lights up. Its children are clipped to its corners (they can brighten on
 * hover with `group-hover/card:`). With `onClick` it's a button (zooms in, e.g. to a
 * photo); without, a plain card.
 */
const GlowCard = ({ size = "md", className, children, onClick, type = "button", ...props }: GlowCardProps) => {
  const shell = clsx(
    "group/card relative isolate block w-full text-left transition-[translate] duration-550 ease-out-quint hover:-translate-y-1 motion-reduce:transition-none",
    RADIUS[size],
    className,
  );
  const content = (
    <>
      <span aria-hidden="true" className={GLOW} />
      <span className="relative block overflow-hidden rounded-[inherit]">
        {children}
        <span aria-hidden="true" className={HIGHLIGHT} />
        <span aria-hidden="true" className={EDGE} />
      </span>
    </>
  );
  return onClick ? (
    <button
      {...props}
      type={type}
      onClick={onClick}
      onPointerMove={pointerLight}
      className={clsx(
        shell,
        "focus-ring cursor-zoom-in focus-visible:-translate-y-1 active:-translate-y-0.5 active:duration-200",
      )}
    >
      {content}
    </button>
  ) : (
    <div onPointerMove={pointerLight} className={shell}>
      {content}
    </div>
  );
};

export default GlowCard;
