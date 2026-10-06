import type { PanelView } from "#/stores/usePanelStore";
import { EXPERIMENTS } from "#/components/three.js/voyager/data";
import PanelHeader from "#/components/pages/home/panel/PanelHeader";
import { labHeader } from "#/components/pages/home/panel/content";
import { MEDIA } from "#/components/pages/home/panel/layout";
import ExperimentCard from "./ExperimentCard";

/** One column on a phone and three in the full view; two at the side. */
const GRID: Record<PanelView, string> = {
  full: "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-5",
  side: "grid grid-cols-2 gap-3",
};

/** The Lab in the panel (P27-80): what's on Parker's memory card, its experiments as cards. */
const LabContent = ({ view, titleId }: { view: PanelView; titleId: string }) => (
  <>
    <PanelHeader view={view} model={labHeader()} titleId={titleId} />
    <div className={MEDIA[view]}>
      <div className={GRID[view]}>
        {EXPERIMENTS.map((experiment) => (
          <ExperimentCard
            key={experiment.id}
            experiment={experiment}
            view={view}
          />
        ))}
      </div>
    </div>
  </>
);

export default LabContent;
