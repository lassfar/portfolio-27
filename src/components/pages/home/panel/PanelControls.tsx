import clsx from "clsx";
import type { Ref } from "react";
import { Maximize2, PanelRight, X } from "lucide-react";
import IconButton from "#/components/UI/buttons/IconButton";
import { usePanelStore, type PanelView } from "#/stores/usePanelStore";

/** The other view, offered by the mode button. */
const MODE: Record<PanelView, { icon: typeof PanelRight; label: string; tooltip: string }> = {
  full: { icon: PanelRight, label: "Show as a side panel", tooltip: "Side panel" },
  side: { icon: Maximize2, label: "Open the full view", tooltip: "Full view" },
};

/** Top right: further in for the full view on larger screens. */
const PLACE: Record<PanelView, string> = {
  full: "top-4.5 right-4.5 sm:top-8 sm:right-10",
  side: "top-4.5 right-4.5 sm:top-6 sm:right-6",
};

/**
 * The panel's controls (P27-80): switch between the full view and the side panel, and
 * close ("Close · Esc"). The close button is first focused when the panel opens.
 */
const PanelControls = ({ view, closeRef }: { view: PanelView; closeRef?: Ref<HTMLButtonElement> }) => {
  const mode = MODE[view];
  return (
    <div className={clsx("absolute z-3 flex gap-3", PLACE[view])}>
      <IconButton
        icon={mode.icon}
        label={mode.label}
        tooltip={mode.tooltip}
        onClick={() => usePanelStore.getState().toggleView()}
      />
      <IconButton
        ref={closeRef}
        data-autofocus
        icon={X}
        label="Close"
        tooltip="Close · Esc"
        aria-keyshortcuts="Escape"
        onClick={() => usePanelStore.getState().close()}
      />
    </div>
  );
};

export default PanelControls;
