import clsx from "clsx";
import { forwardRef } from "react";

type Props = {
  /** The thematic word for the section, e.g. "ORIGIN", "THE MAKER". */
  label: string;
  className?: string;
};

/**
 * A small editorial "spine" that runs vertically down the right edge of a
 * section — a thin rule, a wide-tracked uppercase label (Helvetica Neue) and a
 * peach accent dot. A quiet way to name each beat of the story without competing
 * with the big cursive titles.
 */
const SectionMarker = forwardRef<HTMLDivElement, Props>(
  ({ label, className }, ref) => (
    <div
      ref={ref}
      aria-hidden
      className={clsx(
        "pointer-events-none select-none",
        "absolute right-4 sm:right-6 md:right-8 top-0 bottom-0 z-30",
        "flex items-center",
        className
      )}
    >
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <span className="h-8 sm:h-10 w-px bg-white/20" />
        <span
          className={clsx(
            "font-sans uppercase text-white/40",
            "text-[10px] sm:text-[11px] font-medium"
          )}
          style={{ writingMode: "vertical-rl", letterSpacing: "0.42em" }}
        >
          {label}
        </span>
        <span className="h-1.5 w-1.5 rounded-full bg-peach/70" />
      </div>
    </div>
  )
);

SectionMarker.displayName = "SectionMarker";

export default SectionMarker;
