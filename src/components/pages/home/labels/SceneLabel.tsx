import clsx from "clsx";
import { ArrowUpRight } from "lucide-react";
import Icon from "#/components/UI/icons/Icon";
import { pointerLight } from "#/components/UI/glass/pointerLight";
import type { SceneLabelProps, SceneLabelTone } from "./sceneLabel.types";

const TONE: Record<SceneLabelTone, string> = {
  place: "text-light-peach",
  card: "text-peach",
};

/**
 * A label in the scene that opens a panel (Storybook: Home/SceneLabel, P27-80): it says
 * what it opens — an icon, the name, "· 5 shots", an arrow that nudges out on hover —
 * in liquid glass, and breathes a peach ring until the first panel is opened, so it
 * reads as something to click. The Earth's places and Parker's memory card use it.
 *
 * Its overlay places it (`className`) and shows it — it owns the label's `transform`,
 * `opacity`, pointer events and `tabIndex` (written every frame, never by React). It
 * moves with `translate` / `scale` on hover (the `liquid` utility), never `transform`.
 */
const SceneLabel = ({
  ref,
  icon,
  name,
  meta,
  tone = "place",
  fresh = false,
  labelKey,
  className,
  type = "button",
  ...props
}: SceneLabelProps) => (
  <button
    {...props}
    ref={ref}
    type={type}
    data-scene-label={labelKey}
    aria-haspopup="dialog"
    onPointerMove={pointerLight}
    className={clsx(
      "glass liquid tap-target group/label inline-flex items-center gap-2 whitespace-nowrap rounded-full py-1.75 pr-3 pl-2.5 text-xs font-light tracking-wide hover:text-white focus-visible:text-white max-sm:pr-2.75 max-sm:pl-2.25 max-sm:text-2xs",
      TONE[tone],
      className,
    )}
  >
    <span
      aria-hidden="true"
      className={clsx(
        "pointer-events-none absolute -inset-1.25 rounded-[inherit] opacity-0 shadow-halo ring-1 ring-peach/55",
        fresh && "motion-safe:animate-breathe motion-reduce:opacity-100",
      )}
    />
    <Icon icon={icon} size={15} className="text-peach" />
    {name}
    <span className="text-light-peach/60">· {meta}</span>
    <Icon
      icon={ArrowUpRight}
      size={15}
      className="text-peach transition-transform duration-300 ease-spring group-hover/label:translate-x-0.5 group-hover/label:-translate-y-0.5 group-focus-visible/label:translate-x-0.5 group-focus-visible/label:-translate-y-0.5"
    />
  </button>
);

export default SceneLabel;
