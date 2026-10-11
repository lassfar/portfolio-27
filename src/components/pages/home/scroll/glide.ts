import gsap from "gsap";
import { ScrollSmoother, ScrollTrigger } from "gsap/all";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { isScrollLocked } from "#/stores/scrollLock";
import { useGlide, type GlideSource } from "#/stores/useGlide";
import { cancelRefocusAfterGlide, refocusAfterGlide } from "./glideFocus";

let current: gsap.core.Tween | null = null; // the glide running, if any

/** Where master progress `mp` lies on the page (px); null without the pinned journey. */
function journeyY(mp: number): number | null {
  const trigger = journeyTrigger.current;
  return trigger ? trigger.start + mp * (trigger.end - trigger.start) : null;
}

/** A glide ended (done, or interrupted): unless another has replaced it, none is running. */
function end(tween: gsap.core.Tween): void {
  if (current !== tween) return;
  current = null;
  useGlide.getState().setBy(null);
}

/**
 * Glide the smooth scroll to a point of the pinned journey (master progress 0..1): a
 * tween of ScrollSmoother's `scrollTop`, so the whole story plays on the way. Does
 * nothing while a panel holds the scroll. Who started it (`by`) is published in
 * useGlide while it runs. When it started with the keyboard's focus in the page, the focus is
 * given a visible place once it's over (glideFocus.ts). Returns whether it started.
 */
export function glideToJourney(
  mp: number,
  seconds: number,
  ease = "power3.inOut",
  by?: GlideSource,
): boolean {
  const y = journeyY(mp);
  if (y === null || isScrollLocked()) return false;
  const smoother = ScrollSmoother.get();
  if (!smoother) {
    window.scrollTo({ top: y, behavior: "smooth" });
    return true;
  }
  // It replaces any glide before it (`overwrite`): that one's `end` then changes nothing, so
  // `by` goes straight from one glide to the next, never through "none".
  current = null;
  cancelRefocusAfterGlide();
  // A keyboard's focus (or a screen reader's): a click or a tap leaves its target focused too.
  const hadFocus = document.activeElement?.matches(":focus-visible") ?? false;
  const finish = () => {
    const last = current === tween;
    end(tween);
    if (last && hadFocus) refocusAfterGlide();
  };
  const tween: gsap.core.Tween = gsap.to(smoother, {
    scrollTop: y,
    duration: seconds,
    ease,
    overwrite: true,
    onComplete: finish,
    onInterrupt: finish,
  });
  current = tween;
  useGlide.getState().setBy(by ?? null);
  return true;
}

/**
 * Jump straight to a point of the pinned journey (master progress 0..1): the dev panel, an
 * instant goTo, the mode switch's landing. Returns whether it could (not without the pinned
 * journey).
 *
 * Not when it's already there (P27-94): ScrollSmoother would mark the scroll as set by code
 * with nothing to draw, so the mark would stay, and swallow the visitor's next scroll (a key,
 * the scrollbar).
 */
export function jumpToJourney(mp: number): boolean {
  const y = journeyY(mp);
  if (y === null) return false;
  const smoother = ScrollSmoother.get();
  if (!smoother) {
    window.scrollTo(0, y);
    return true;
  }
  const to = Math.max(0, Math.min(y, ScrollTrigger.maxScroll(window)));
  if (Math.abs(smoother.scrollTop() - to) >= 0.5) smoother.scrollTo(to, false);
  return true;
}

/**
 * Stop a glide: the visitor takes the scroll back. The whole tween is killed (not just its
 * `scrollTop`): a per-property kill only fires `onInterrupt` once the tween has started, so a
 * wheel in the click's own frame would have left the glide "running" until its end.
 */
export function stopGlide(): void {
  const smoother = ScrollSmoother.get();
  if (smoother) gsap.killTweensOf(smoother);
}

/** The keys that scroll the page (with or without a modifier: Shift+Space, ⌘↓). */
const SCROLL_KEYS = new Set([" ", "PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"]);

/** Whether `target` takes typing (a key pressed there doesn't scroll the page). */
const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
};

/**
 * Whether a key press scrolls the page, and so takes it back from a glide (P27-99): Space,
 * PageUp/Down, Home/End, ↑/↓. Not Tab (a keyboard visitor moves through the timeline while it
 * glides), Enter, Escape, a lone modifier or a letter, nor anything typed in a field.
 */
export const isScrollKey = (event: Pick<KeyboardEvent, "key" | "target">): boolean =>
  SCROLL_KEYS.has(event.key) && !isTyping(event.target);

const stopOnScrollKey = (event: KeyboardEvent) => {
  if (isScrollKey(event)) stopGlide();
};

let inputUsers = 0; // components that asked for stopGlideOnInput (the listeners are shared)

/**
 * A wheel, a touch or a scroll key takes the scroll back from a glide. Several components can
 * ask for it (the timeline, the phase buttons): the listeners go on with the first and
 * off with the last. Returns the cleanup (for a useEffect).
 */
export function stopGlideOnInput(): () => void {
  if (inputUsers++ === 0) {
    window.addEventListener("wheel", stopGlide, { passive: true });
    window.addEventListener("touchstart", stopGlide, { passive: true });
    window.addEventListener("keydown", stopOnScrollKey);
  }
  return () => {
    if (--inputUsers > 0) return;
    window.removeEventListener("wheel", stopGlide);
    window.removeEventListener("touchstart", stopGlide);
    window.removeEventListener("keydown", stopOnScrollKey);
  };
}
