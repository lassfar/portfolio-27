"use client";

import clsx from "clsx";
import { useEffect, useId, useRef, type Ref } from "react";
import { selectIsOpen, usePanelStore, type PanelView } from "#/stores/usePanelStore";
import { cosmicVeil } from "#/stores/cosmicVeil";
import PlaceContent from "#/components/pages/home/gallery/PlaceContent";
import LabContent from "#/components/pages/home/lab/LabContent";
import PanelControls from "./PanelControls";
import PanelEyebrow from "./PanelEyebrow";
import { headerOf } from "./content";
import { COLUMN, SWAP, SWAPPING } from "./layout";
import { usePanelEntrance } from "./usePanelEntrance";
import { PANEL_ID } from "./config";
import { usePanelFrame } from "./usePanelFrame";

/** Its size, shape and fill animate between the two views (and in and out). */
const SHELL =
  "fixed right-0 bottom-0 z-50 flex flex-col duration-600 ease-out-quint calm:duration-300";

/** The full view covers the screen (the scene veiled behind it); the side panel is frosted glass — a bottom sheet on a phone. */
const SHELL_VIEW: Record<PanelView, string> = {
  full: "h-dvh w-full bg-rich-black/30",
  side: "h-2/3 w-full rounded-t-3xl bg-rich-black/76 shadow-sheet inset-shadow-sheet backdrop-blur-xl backdrop-saturate-150 sm:h-dvh sm:w-panel-side sm:rounded-none sm:border-l sm:border-white/10 sm:shadow-panel sm:inset-shadow-none",
};

/**
 * Open, it shows at once (so focus can move in) and fades in; closed, it fades out (the
 * side panel slides off too) and only then hides. Never a translate while open: it would
 * re-base fixed children. In calm motion it only fades, shorter, and the views swap sizes
 * at once while the content cross-fades (P27-92).
 */
const SHELL_OPEN =
  "visible transition-[opacity,width,height,translate,background-color,border-radius,box-shadow] calm:transition-opacity";
const SHELL_CLOSED: Record<PanelView, string> = {
  full: "invisible pointer-events-none opacity-0 transition-[opacity,visibility]",
  side: "invisible pointer-events-none opacity-0 transition-[opacity,visibility,translate] moving:translate-y-full moving:sm:translate-x-full moving:sm:translate-y-0",
};

/**
 * The scene's panel (P27-80; was the gallery's and the Lab's side panels): a place's
 * photos or the Lab's experiments, opened by a scene label or a 3D pin. It opens as a
 * side panel beside the scene (a bottom sheet on a phone) or, by choice, in the full
 * view — over the whole screen, the scene veiled behind it and the story's overlays
 * stepping back (`<html data-panel>`, read by the `panel-full:` variant). Its content
 * swaps with a short fade (usePanelFrame). Portalled to the body; SceneOverlays makes it
 * a dialog (focus, keys).
 */
const ScenePanel = ({ ref }: { ref?: Ref<HTMLElement> }) => {
  const open = usePanelStore(selectIsOpen);
  const view = usePanelStore((s) => s.view);
  const titleId = useId();
  const scroll = useRef<HTMLDivElement>(null);
  const { frame, morphing } = usePanelFrame(scroll);
  const content = useRef<HTMLDivElement>(null);

  usePanelEntrance(content, frame?.key);
  const eyebrow = frame ? headerOf(frame.content)?.eyebrow : undefined;

  // The full view veils the scene (WebGL) and the story's overlays step back (`panel-full:`).
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.panel = view;
    else delete root.dataset.panel;
    cosmicVeil.panel = open && view === "full" ? 1 : 0;
  }, [open, view]);
  useEffect(
    () => () => {
      delete document.documentElement.dataset.panel;
      cosmicVeil.panel = 0;
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
      {/* The content scrolls under the buttons, softly faded at the panel's top edge. */}
      <div
        ref={scroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain mask-t-from-98% scrollbar-thin"
      >
        {frame && (
          <div
            ref={content}
            key={frame.key}
            className={clsx(COLUMN[frame.view], SWAP, morphing && SWAPPING)}
          >
            {eyebrow && <PanelEyebrow view={frame.view} eyebrow={eyebrow} />}
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
