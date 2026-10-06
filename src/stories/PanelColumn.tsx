import clsx from "clsx";
import { useRef, type ReactNode } from "react";
import type { PanelView } from "#/stores/usePanelStore";
import { COLUMN } from "#/components/pages/home/panel/layout";
import { usePanelEntrance } from "#/components/pages/home/panel/usePanelEntrance";

/** The column playing the panel's entrance: its parts rise in, its swash draws. */
const Entrance = ({ view, children }: { view: PanelView; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  usePanelEntrance(ref, view);
  return (
    <div ref={ref} className={COLUMN[view]}>
      {children}
    </div>
  );
};

interface PanelColumnProps {
  view: PanelView;
  /** Plays the panel's entrance (a header's swash waits for it to draw). */
  entrance?: boolean;
  children: ReactNode;
}

/**
 * A panel part's story context (P27-82): the panel's own column (COLUMN), at the side
 * panel's width at the side.
 */
const PanelColumn = ({ view, entrance = false, children }: PanelColumnProps) => (
  <div className={clsx(view === "side" && "w-panel-side")}>
    {entrance ? (
      <Entrance view={view}>{children}</Entrance>
    ) : (
      <div className={COLUMN[view]}>{children}</div>
    )}
  </div>
);

export default PanelColumn;
