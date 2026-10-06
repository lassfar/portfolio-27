import clsx from "clsx";
import type { QuietLabelProps, QuietLabelTone } from "#/components/UI/labels/label.types";

const TONE: Record<QuietLabelTone, string> = {
  soft: "text-light-peach/80 ring-white/10",
  peach: "text-peach ring-peach/30",
};

/**
 * A quiet name pill (Storybook: UI/QuietLabel, P27-82): small light text on a dark pill
 * with a hairline ring, for the scene's names that open nothing — Parker's journey and its
 * distance, the probe seen from afar. (What opens a panel is a SceneLabel.)
 */
const QuietLabel = ({ tone = "soft", className, ...props }: QuietLabelProps) => (
  <span
    {...props}
    className={clsx(
      "rounded-full bg-rich-black/70 px-2 py-0.5 text-3xs font-light tracking-wide whitespace-nowrap ring-1 transition-[opacity,color] duration-300",
      TONE[tone],
      className,
    )}
  />
);

export default QuietLabel;
