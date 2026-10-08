import { useEffect, type RefObject } from "react";
import { usePanelStore } from "#/stores/usePanelStore";
import { isCalm } from "#/stores/useMotion";
import { SHEET, sheetRelease } from "./sheet";

/** The bottom sheet: below `sm`, where the side panel sits at the bottom of the screen. */
const SHEET_QUERY = "(max-width: 639px)";

/**
 * Swipe the bottom sheet down to close it (P27-95): it follows the finger, then closes past a
 * point or on a flick (sheetRelease), or goes back. From its grip (the top strip, pointer
 * events), or from its content scrolled to the top (touch events: a pull down that isn't a
 * scroll). With motion it slides back, or off as it closes; in the calm mode it follows the
 * finger only (direct manipulation, WCAG 2.3.3): back at once, or it fades where it is. The
 * Close button and Escape stay (2.5.1, 2.5.7).
 */
export function useSheetDrag(
  gripRef: RefObject<HTMLElement | null>,
  scrollRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  useEffect(() => {
    const grip = gripRef.current;
    const scroll = scrollRef.current;
    const sheet = scroll?.parentElement;
    if (!enabled || !scroll || !sheet) return;

    let y0 = 0;
    let dy = 0;
    let dragging = false;
    let samples: { t: number; y: number }[] = [];

    const begin = (y: number) => {
      y0 = y;
      dy = 0;
      dragging = false;
      samples = [{ t: performance.now(), y }];
    };
    const follow = (y: number) => {
      dy = Math.max(0, y - y0);
      const now = performance.now();
      samples = [...samples.filter((s) => now - s.t <= SHEET.flickWindow), { t: now, y }];
      if (!dragging && dy < SHEET.startAfter) return;
      dragging = true;
      sheet.style.transition = "none";
      sheet.style.translate = `0 ${dy}px`;
    };
    const finish = (cancelled = false) => {
      if (!dragging) return;
      dragging = false;
      const [first, last] = [samples[0], samples.at(-1)!];
      const speed = last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
      const verdict = cancelled ? "back" : sheetRelease(dy, speed, sheet.offsetHeight);
      if (verdict === "close") {
        // From where it is: with motion it slides on off (its closed state), in calm it fades.
        sheet.style.transition = "";
        if (!isCalm()) sheet.style.translate = "";
        usePanelStore.getState().close();
      } else if (isCalm()) {
        sheet.style.transition = "";
        sheet.style.translate = "";
      } else {
        sheet.style.transition = "translate 220ms ease-out";
        sheet.style.translate = "0 0";
        sheet.addEventListener(
          "transitionend",
          () => {
            sheet.style.transition = "";
            sheet.style.translate = "";
          },
          { once: true },
        );
      }
    };

    // The grip: a pointer (touch or mouse) pulling it.
    const press = (e: PointerEvent) => {
      if (!window.matchMedia(SHEET_QUERY).matches) return;
      try {
        grip?.setPointerCapture(e.pointerId);
      } catch {
        // Not a live pointer (a test): the moves still come here.
      }
      begin(e.clientY);
    };
    const pull = (e: PointerEvent) => {
      if (samples.length) follow(e.clientY);
    };
    const letGo = (e: PointerEvent) => {
      finish(e.type === "pointercancel");
      samples = [];
    };
    grip?.addEventListener("pointerdown", press);
    grip?.addEventListener("pointermove", pull);
    grip?.addEventListener("pointerup", letGo);
    grip?.addEventListener("pointercancel", letGo);

    // The content, scrolled to its top: a pull down rather than a scroll.
    let x0 = 0;
    let may = false;
    const touch = (e: TouchEvent) => {
      may = window.matchMedia(SHEET_QUERY).matches && scroll.scrollTop <= 0;
      if (!may) return;
      x0 = e.touches[0].clientX;
      begin(e.touches[0].clientY);
    };
    const drag = (e: TouchEvent) => {
      if (!may) return;
      const { clientX, clientY } = e.touches[0];
      if (!dragging) {
        const down = clientY - y0;
        if (Math.abs(down) < SHEET.startAfter) return;
        // Up, or more sideways than down: the content scrolls as usual.
        if (down <= 0 || Math.abs(clientX - x0) > down) {
          may = false;
          return;
        }
      }
      e.preventDefault();
      follow(clientY);
    };
    const lift = (e: TouchEvent) => {
      if (may) finish(e.type === "touchcancel");
      may = false;
    };
    scroll.addEventListener("touchstart", touch, { passive: true });
    scroll.addEventListener("touchmove", drag, { passive: false });
    scroll.addEventListener("touchend", lift);
    scroll.addEventListener("touchcancel", lift);

    return () => {
      grip?.removeEventListener("pointerdown", press);
      grip?.removeEventListener("pointermove", pull);
      grip?.removeEventListener("pointerup", letGo);
      grip?.removeEventListener("pointercancel", letGo);
      scroll.removeEventListener("touchstart", touch);
      scroll.removeEventListener("touchmove", drag);
      scroll.removeEventListener("touchend", lift);
      scroll.removeEventListener("touchcancel", lift);
    };
  }, [enabled, gripRef, scrollRef]);
}
