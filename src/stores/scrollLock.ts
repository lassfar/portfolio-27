import { ScrollSmoother } from "gsap/all";

/**
 * A tiny lock registry over `ScrollSmoother.paused()`.
 *
 * Several independent features need to FREEZE the smooth scroll at the same time
 * and must not clobber each other's paused() state:
 *   • the scene's panel (a place's photos / the Lab: usePanelStore) — pause while open;
 *   • the journey's hard checkpoints (Earth arrival) — pause on arrival until a
 *     fresh forward gesture.
 *
 * The smoother is paused while ANY key holds a lock, and only resumes once every
 * key has released — so closing a panel while a checkpoint still holds keeps the
 * scroll frozen, and vice-versa.
 */
const locks = new Set<string>();

/**
 * While paused, ScrollSmoother still lets nested elements scroll (a panel's content): on
 * each wheel / touch / scroll it climbs from the event's target up to <body> for a
 * scrollable parent (ScrollTrigger's `_nestedScroll`). From a target outside the body —
 * the document (a page scroll), <html> (its scrollbar) — it climbs past it to `document`
 * and calls getComputedStyle(document), which throws. Those events are stopped before it
 * (window, capture; listened to before the smoother pauses) and kept from scrolling the
 * frozen page.
 */
const OUTSIDE_BODY_EVENTS = [
  "wheel",
  "scroll",
  "touchstart",
  "touchmove",
  "pointerdown",
  "pointermove",
];
const insideBody = (target: EventTarget | null) =>
  target instanceof Element && target !== document.body && document.body.contains(target);
const stopOutsideBody = (e: Event) => {
  if (insideBody(e.target) || e.target === document.body) return;
  e.stopImmediatePropagation();
  if (e.cancelable && e.type !== "pointerdown") e.preventDefault();
};
const guardOutsideBody = (on: boolean) => {
  for (const type of OUTSIDE_BODY_EVENTS) {
    if (on) window.addEventListener(type, stopOutsideBody, { capture: true, passive: false });
    else window.removeEventListener(type, stopOutsideBody, { capture: true });
  }
};

/** Whether any feature is holding the smooth scroll frozen right now. */
export const isScrollLocked = (): boolean => locks.size > 0;

export function setScrollLock(key: string, on: boolean): void {
  const wasLocked = locks.size > 0;
  if (on) locks.add(key);
  else locks.delete(key);
  const isLocked = locks.size > 0;
  if (wasLocked === isLocked) return;
  const smoother = ScrollSmoother.get();
  if (!smoother) return;
  if (isLocked) guardOutsideBody(true); // first: before the smoother's own listeners
  smoother.paused(isLocked);
  if (!isLocked) guardOutsideBody(false);
}
