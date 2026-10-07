import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Icon from "#/components/UI/icons/Icon";
import { pointerLight } from "#/components/UI/glass/pointerLight";
import type { PanelView } from "#/stores/usePanelStore";
import { adjacentPlace, shortName } from "#/components/pages/home/panel/content";

const ROW: Record<PanelView, string> = {
  full: "mt-12 pt-7",
  side: "mt-6 pt-5",
};

/** "Previous" / "Next" above the names: the full view on larger screens only. */
const HINT: Record<PanelView, string> = {
  full: "hidden sm:inline",
  side: "hidden",
};

const STEP =
  "glass liquid tap-target relative inline-flex items-center gap-2.5 rounded-full py-2.5 text-sm font-light text-gray-slate/60 hover:text-light-peach focus-visible:text-light-peach";

/** The end of a place's panel (P27-80): on to the previous or the next place. */
const PlaceStepper = ({
  view,
  currentId,
  onPick,
}: {
  view: PanelView;
  currentId: string;
  onPick: (id: string) => void;
}) => {
  const steps = [
    { dir: "prev", place: adjacentPlace(currentId, -1), hint: "Previous" },
    { dir: "next", place: adjacentPlace(currentId, 1), hint: "Next" },
  ] as const;
  return (
    <nav
      aria-label="More places"
      className={clsx(
        "flex w-full items-center justify-between gap-3 border-t border-white/10",
        ROW[view],
      )}
    >
      {steps.map(({ dir, place, hint }) => (
        <button
          key={dir}
          type="button"
          data-focus-key={`step:${dir}`}
          aria-label={`${hint} place: ${place.place}`}
          onPointerMove={pointerLight}
          onClick={() => onPick(place.id)}
          className={clsx(STEP, dir === "prev" ? "pr-4 pl-3" : "flex-row-reverse pr-3 pl-4")}
        >
          <Icon
            icon={dir === "prev" ? ChevronLeft : ChevronRight}
            size={15}
            className="text-peach"
          />
          <span
            className={clsx("text-3xs tracking-eyebrow-sm text-white/50 uppercase", HINT[view])}
          >
            {hint}
          </span>
          {shortName(place)}
        </button>
      ))}
    </nav>
  );
};

export default PlaceStepper;
