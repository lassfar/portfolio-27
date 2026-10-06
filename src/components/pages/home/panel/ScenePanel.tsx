"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, type Ref } from "react";
import { selectIsOpen, usePanelStore, type PanelView } from "#/stores/usePanelStore";
import PlaceContent from "#/components/pages/home/gallery/PlaceContent";
import LabContent from "#/components/pages/home/lab/LabContent";
import PanelControls from "./PanelControls";
import { PANEL_ID } from "./config";
import { usePanelFrame } from "./usePanelFrame";

/** Its size, shape and fill animate between the two views (and in and out). */
const SHELL = "fixed right-0 bottom-0 z-50 flex flex-col duration-600 ease-out-quint motion-reduce:transition-none";

/** The full view covers the screen (the scene veiled behind it); the side panel is frosted glass — a bottom sheet on a phone. */
const SHELL_VIEW: Record<PanelView, string> = {
  full: "h-dvh w-full bg-rich-black/30",
  side: "h-2/3 w-full rounded-t-3xl bg-rich-black/76 shadow-sheet inset-shadow-sheet backdrop-blur-xl backdrop-saturate-150 sm:h-dvh sm:w-panel-side sm:rounded-none sm:border-l sm:border-white/10 sm:shadow-panel sm:inset-shadow-none",
};

/**
 * Open, it shows at once (so focus can move in) and fades in; closed, it fades out (the
 * side panel slides off too) and only then hides. Never a translate while open: it would
 * re-base fixed children.
 */
const SHELL_OPEN = "visible transition-[opacity,width,height,translate,background-color,border-radius,box-shadow]";
const SHELL_CLOSED: Record<PanelView, string> = {
  full: "invisible pointer-events-none opacity-0 transition-[opacity,visibility]",
  side: "invisible pointer-events-none translate-y-full opacity-0 transition-[opacity,visibility,translate] sm:translate-x-full sm:translate-y-0",
};

/** The content: one centred column in the full view (like the Maker), a reading column at the side. */
const INNER: Record<PanelView, string> = {
  full: "mx-auto flex max-w-panel flex-col items-center px-5 pt-21 pb-10 sm:px-16 sm:pt-26 sm:pb-24",
  side: "flex flex-col px-5 pt-10 pb-7 sm:px-8 sm:pt-16 sm:pb-10",
};

/**
 * The scene's panel (P27-80; was the gallery's and the Lab's side panels): a place's
 * photos or the Lab's experiments, opened by a scene label or a 3D pin. It opens in the
 * full view — over the whole screen, the scene veiled behind it and the story's
 * overlays stepping back (`<html data-panel>`, read by the `panel-full:` variant) — or,
 * by choice, as a side panel beside the scene. Its content swaps with a short fade
 * (usePanelFrame). Portalled to the body; SceneOverlays makes it a dialog (focus, keys).
 */
const ScenePanel = ({ ref }: { ref?: Ref<HTMLElement> }) => {
  const open = usePanelStore(selectIsOpen);
  const view = usePanelStore((s) => s.view);
  const titleId = useId();
  const scroll = useRef<HTMLDivElement>(null);
  const { frame, morphing } = usePanelFrame(scroll);

  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.panel = view;
    else delete root.dataset.panel;
  }, [open, view]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.panel;
    },
    [],
  );

  return (
    <section
      ref={ref}
      id={PANEL_ID}
      role="dialog"
      aria-modal={view === "full"}
      aria-labelledby={titleId}
      className={clsx(SHELL, SHELL_VIEW[view], open ? SHELL_OPEN : SHELL_CLOSED[view])}
    >
      {view === "side" && (
        <span
          aria-hidden="true"
          className="absolute top-2.25 left-1/2 z-3 h-1 w-9.5 -translate-x-1/2 rounded-full bg-white/22 sm:hidden"
        />
      )}
      <PanelControls view={view} />
      <div ref={scroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain scrollbar-thin">
        {frame && (
          <div
            key={frame.key}
            className={clsx(
              INNER[frame.view],
              "transition-[opacity,translate] duration-240 ease-out motion-reduce:transition-none",
              morphing && "translate-y-2 opacity-0",
            )}
          >
            {frame.content.kind === "place" ? (
              <PlaceContent id={frame.content.id} view={frame.view} titleId={titleId} />
            ) : (
              <LabContent view={frame.view} titleId={titleId} />
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default ScenePanel;
