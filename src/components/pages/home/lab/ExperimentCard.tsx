import clsx from "clsx";
import type { CSSProperties } from "react";
import GlowCard from "#/components/UI/cards/GlowCard";
import type { Experiment } from "#/components/three.js/voyager/data";
import type { PanelView } from "#/stores/usePanelStore";
import { RISE } from "#/components/pages/home/panel/layout";

const PAD: Record<PanelView, string> = { full: "p-6", side: "p-4" };
const TITLE: Record<PanelView, string> = { full: "text-lg", side: "text-sm" };

/**
 * One of the Lab's experiments (P27-80): a glow card (not a button yet: none is live),
 * "Drifting in soon" with a slow pulse, its title and a line about it.
 */
const ExperimentCard = ({
  experiment,
  view,
  className,
  style,
}: {
  experiment: Experiment;
  view: PanelView;
  className?: string;
  style?: CSSProperties;
}) => (
  <GlowCard {...RISE} size={view === "full" ? "md" : "sm"} className={className} style={style}>
    <span
      className={clsx(
        "flex aspect-4/3 flex-col justify-end gap-1.5 bg-dark/45 bg-radial-[120%_90%_at_85%_0%] from-peach/12 to-transparent to-60%",
        PAD[view],
      )}
    >
      <span className="inline-flex items-center gap-2 text-3xs uppercase tracking-eyebrow text-white/50">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-peach/60 motion-safe:animate-pulse" />
        {experiment.status === "live" ? "Live" : "Drifting in soon"}
      </span>
      <span className={clsx("font-light text-white/74", TITLE[view])}>{experiment.title}</span>
      <span className="text-xs leading-normal text-white/50">{experiment.blurb}</span>
    </span>
  </GlowCard>
);

export default ExperimentCard;
