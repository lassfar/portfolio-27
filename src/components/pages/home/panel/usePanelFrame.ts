import { useEffect, useRef, useState, type RefObject } from "react";
import { panelKey, usePanelStore, type PanelContent, type PanelView } from "#/stores/usePanelStore";
import { MORPH_MS } from "./config";

/** What the panel shows: its content in a view; `key` changes each time it's swapped in. */
export type PanelFrame = { content: PanelContent; view: PanelView; key: number };

/**
 * The panel's content on screen (P27-80), a step behind the store: on opening it shows at
 * once; on a switch while open (another place, or the other view) it fades out first
 * (`morphing`, MORPH_MS) and then swaps — so nothing is laid out again while it's seen —
 * and the scroll goes back to the top. While the panel closes, the last content stays
 * for its fade-out. A new `key` on each swap replays the content's entrance.
 */
export function usePanelFrame(scroll: RefObject<HTMLElement | null>) {
  const content = usePanelStore((s) => s.content);
  const view = usePanelStore((s) => s.view);
  const [frame, setFrame] = useState<PanelFrame | null>(null);
  const [morphing, setMorphing] = useState(false);
  const shown = useRef<PanelFrame | null>(null);
  const last = useRef<PanelContent | null>(null);

  useEffect(() => {
    const wasOpen = last.current !== null;
    last.current = content;
    if (!content) return; // closing: the last frame stays for the fade-out
    const swap = () => {
      const next = { content, view, key: (shown.current?.key ?? 0) + 1 };
      shown.current = next;
      setFrame(next);
      setMorphing(false);
      scroll.current?.scrollTo({ top: 0 });
    };
    const now = shown.current;
    if (!wasOpen || !now) {
      swap();
      return;
    }
    if (panelKey(now.content) === panelKey(content) && now.view === view) return;
    setMorphing(true);
    const timer = window.setTimeout(swap, MORPH_MS);
    return () => window.clearTimeout(timer);
  }, [content, view, scroll]);

  return { frame, morphing };
}
