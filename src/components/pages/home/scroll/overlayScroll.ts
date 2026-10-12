import { ScrollTrigger } from "gsap/all";
import { isScrollLocked } from "#/stores/scrollLock";
import { isGliding, isScrollKey } from "./glide";

/**
 * The journey's overlays on a short screen (P27-101: zoom 400%, a phone held sideways, WCAG
 * 1.4.10). They're laid over the pinned screen and cut to its height, so when one doesn't fit:
 * - About and the Craft follow the journey's scroll (`followScroll`): their words and drawing
 *   are tied to it already (they write in, they build), so the scroll scrolls them too;
 * - Contact, a form at the page's end, scrolls on its own (`routeScroll`): the wheel, a swipe
 *   or a scroll key moves the form first, then the journey.
 * Where an overlay fits, nothing changes. GSAP's own nested scroll isn't used: after a touch
 * scroll it can click what the finger lifted on (its Observer sees the release, not the drag).
 */

/** Down (1) or up (-1). */
type Direction = 1 | -1;

/** Whether a box scrolled to `top` (of `max`) can still move `direction`. */
export const canScroll = (top: number, max: number, direction: Direction): boolean =>
  direction > 0 ? top < max - 0.5 : top > 0.5;

/** How far a scroll key moves a box `height` tall that scrolls `max` (px, + is down); null if it doesn't. */
export const keyScroll = (
  key: string,
  shift: boolean,
  height: number,
  max: number,
): number | null => {
  const page = height * 0.85;
  switch (key) {
    case "ArrowDown":
      return 40;
    case "ArrowUp":
      return -40;
    case "PageDown":
      return page;
    case "PageUp":
      return -page;
    case " ":
      return shift ? -page : page;
    case "End":
      return max;
    case "Home":
      return -max;
    default:
      return null;
  }
};

/**
 * The nearest scroll (px) that shows `[top, bottom]` (in the box's content), `margin` clear, in a
 * box `height` tall scrolled to `scrollTop`; its top first if it's taller than the box.
 */
export const revealTop = (
  scrollTop: number,
  height: number,
  top: number,
  bottom: number,
  margin: number,
): number => {
  if (top - margin < scrollTop) return Math.max(0, top - margin);
  if (bottom + margin > scrollTop + height)
    return Math.max(0, Math.min(top - margin, bottom + margin - height));
  return scrollTop;
};

/** A block of words that writes in over an equal share of the write-in (content px). */
export type Part = { top: number; height: number };

/**
 * Where the writing is at write-in progress `t` (0..1): each part writes in over an equal share
 * (the About's paragraphs have equal weights), top to bottom.
 */
export const writingAt = (t: number, parts: readonly Part[]): number => {
  if (!parts.length) return 0;
  const at = Math.min(Math.max(t, 0), 1) * parts.length;
  const i = Math.min(parts.length - 1, Math.floor(at));
  return parts[i].top + (at - i) * parts[i].height;
};

/** The scroll that keeps `y` (content px) at `at` of a box `height` tall (px, within 0..max). */
export const followTop = (y: number, height: number, max: number, at = 0.6): number =>
  Math.min(max, Math.max(0, y - at * height));

/** The share of the write-in over which the text starts following: before it, its title shows. */
const FOLLOW_LEAD = 0.08;

/**
 * The scroll of a box whose `parts` write in at progress `t`: from its top (its title, as it comes
 * in, nothing written yet) into following the writing over the first `FOLLOW_LEAD`.
 */
export const followWriting = (
  t: number,
  parts: readonly Part[],
  height: number,
  max: number,
): number =>
  followTop(writingAt(t, parts), height, max) * Math.min(1, Math.max(t, 0) / FOLLOW_LEAD);

/**
 * Where a box's content ends, laid out (px from its top edge, its bottom padding included):
 * transforms aside, unlike `scrollHeight` (Contact's pieces rise in from 16 px lower, which would
 * count as overflow until the next resize). Its children aren't moved themselves; an svg has no
 * offsets, so it's measured from its box.
 */
const contentBottom = (el: HTMLElement): number => {
  const top = el.getBoundingClientRect().top;
  let bottom = 0;
  for (const child of el.children) {
    bottom = Math.max(
      bottom,
      child instanceof HTMLElement
        ? child.offsetTop + child.offsetHeight
        : child.getBoundingClientRect().bottom - top + el.scrollTop,
    );
  }
  return bottom + parseFloat(getComputedStyle(el).paddingBottom);
};

/**
 * Marks `el` with `data-overflows` while its content is taller than it, measured without the mark
 * (which may add padding), so it never flips back and forth. Again on every resize of the box or
 * of what's in it (fonts, a line added). Returns the cleanup.
 */
function watchOverflow(el: HTMLElement, onMeasure: () => void): () => void {
  const measure = () => {
    // Its padding goes while it's measured: a scroll near the bottom would be cut short by it.
    const top = el.scrollTop;
    el.removeAttribute("data-overflows");
    if (contentBottom(el) > el.clientHeight + 1) el.setAttribute("data-overflows", "");
    el.scrollTop = top;
    onMeasure();
  };
  const observer = new ResizeObserver(measure);
  // Its border box: its padding (`data-overflows:`) changes its content box, as it's measured.
  observer.observe(el, { box: "border-box" });
  for (const child of el.children) observer.observe(child);
  return () => {
    observer.disconnect();
    el.removeAttribute("data-overflows");
  };
}

/** How far a box scrolls by hand (px). */
const maxScroll = (el: HTMLElement) => Math.max(0, el.scrollHeight - el.clientHeight);

export type Follower = {
  /** Where the journey is in this overlay's stay (0..1): the box scrolls to match. */
  set: (t: number) => void;
  dispose: () => void;
};

/**
 * A box the journey scrolls (About, the Craft: `overflow-hidden`, so not by hand). Without
 * `parts`, its top at 0 and its bottom at 1; with them, it follows the writing (`writingAt`).
 * Measured once per resize; it writes only what changed (once per scroll update).
 */
export function followScroll(
  el: HTMLElement | null | undefined,
  parts: readonly (HTMLElement | null)[] = [],
): Follower {
  if (!el) return { set: () => undefined, dispose: () => undefined };
  let max = 0;
  let height = 0;
  let measured: Part[] = [];
  let t = 0;
  let written = 0;
  const apply = () => {
    const top = Math.round(
      max <= 0 ? 0 : measured.length ? followWriting(t, measured, height, max) : t * max,
    );
    if (top !== written) el.scrollTop = written = top;
  };
  const stop = watchOverflow(el, () => {
    max = Math.max(0, contentBottom(el) - el.clientHeight);
    height = el.clientHeight;
    const box = el.getBoundingClientRect();
    measured = parts.flatMap((part) => {
      if (!part) return [];
      const r = part.getBoundingClientRect();
      return [{ top: r.top - box.top + el.scrollTop, height: r.height }];
    });
    apply();
  });
  return {
    set: (next) => {
      t = next;
      apply();
    },
    dispose: () => {
      stop();
      el.scrollTop = 0;
    },
  };
}

/** Space presses these, it doesn't scroll. */
const SPACE_PRESSES =
  "button, summary, [role='button'], [role='switch'], [role='checkbox'], [role='radio'], [role='tab'], [role='menuitem'], [role='option']";

/** How clear of the box's edges a focused field is shown (px). */
const FOCUS_MARGIN = 16;

/** How far a finger moves before its swipe is decided (px): a first move can be 0, or 1 px back. */
const SWIPE_DECIDE_PX = 6;

/**
 * GSAP's scroll saw the press of a swipe the box took, then nothing more: left "pressed", it would
 * ignore the page's own scrolls (a key, the scrollbar) until the next touch. Reset, the way
 * ScrollSmoother does when it pauses.
 */
const releaseNormalizer = () => {
  const normalizer = ScrollTrigger.normalizeScroll?.();
  if (!normalizer?.isPressed) return;
  normalizer.disable();
  normalizer.enable();
};

/** A scroll key's move of the page (the journey), as the browser makes it. */
const scrollPage = (key: string, shift: boolean) => {
  if (key === "Home") window.scrollTo({ top: 0 });
  else if (key === "End") window.scrollTo({ top: document.documentElement.scrollHeight });
  else window.scrollBy({ top: keyScroll(key, shift, window.innerHeight, 0) ?? 0 });
};

export type Router = {
  /** Whether the overlay is fully in (the journey's say): only then does it take the scroll. */
  settle: (settled: boolean) => void;
  /** Back to its top (the overlay has gone). */
  reset: () => void;
  dispose: () => void;
};

/**
 * A box that scrolls on its own inside the pinned journey (Contact: `overflow-y-auto`). While it's
 * fully in and doesn't fit (`data-settled`, `data-overflows`: then it also takes the pointer):
 * - **wheel**: over it, while it can still scroll that way, the wheel is its own (native, with a
 *   trackpad's momentum) and never reaches GSAP; once it can't, the wheel moves the journey;
 * - **touch**: decided once per swipe, after its first few px: the whole swipe is the box's (native,
 *   with momentum; GSAP sees neither the moves nor the release, so it clicks nothing) or the
 *   journey's. Never both, so the journey never jumps. A second finger changes nothing;
 * - **keys** (Space, PageUp/Down, Home/End, ↑/↓; not typed in a field, nor Space on a button): the
 *   box first, then the journey (from a focus inside the box too: the browser's own key scroll
 *   would stay in it, `overscroll-contain`).
 * Off during a glide, while a panel holds the scroll and while the modes switch. A focused element
 * is always scrolled into the box's view, even when focused with `preventScroll` (the skip link,
 * "Write another").
 */
export function routeScroll(el: HTMLElement | null | undefined): Router {
  if (!el) return { settle: () => undefined, reset: () => undefined, dispose: () => undefined };
  const stopWatching = watchOverflow(el, () => undefined);
  const active = () =>
    el.hasAttribute("data-settled") &&
    el.hasAttribute("data-overflows") &&
    !isGliding() &&
    !isScrollLocked() &&
    !document.documentElement.hasAttribute("data-mode-switching");
  const can = (direction: Direction) => canScroll(el.scrollTop, maxScroll(el), direction);
  const inside = (target: EventTarget | null) => target instanceof Node && el.contains(target);

  const onWheel = (e: WheelEvent) => {
    if (!e.deltaY || e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (active() && inside(e.target) && can(e.deltaY > 0 ? 1 : -1)) e.stopImmediatePropagation();
  };

  let swipe: { y: number; own?: boolean } | null = null;
  const onTouchStart = (e: TouchEvent) => {
    if (swipe) return; // another finger: the swipe stays as decided until every finger is up
    if (e.touches.length === 1 && active() && inside(e.target)) swipe = { y: e.touches[0].clientY };
  };
  const onTouchMove = (e: TouchEvent) => {
    if (!swipe) return;
    if (swipe.own === undefined) {
      const dy = swipe.y - e.touches[0].clientY; // the finger up: the content down
      if (Math.abs(dy) < SWIPE_DECIDE_PX) {
        e.stopImmediatePropagation(); // undecided: the journey doesn't move yet
        return;
      }
      swipe.own = can(dy > 0 ? 1 : -1);
      if (swipe.own) releaseNormalizer();
    }
    if (swipe.own) e.stopImmediatePropagation();
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (swipe?.own) e.stopImmediatePropagation();
    if (!e.touches.length) swipe = null;
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !isScrollKey(e)) return;
    if (e.key === " " && e.target instanceof Element && e.target.closest(SPACE_PRESSES)) return;
    if (!active()) return;
    const by = keyScroll(e.key, e.shiftKey, el.clientHeight, maxScroll(el));
    if (!by) return;
    if (can(by > 0 ? 1 : -1)) {
      e.preventDefault();
      el.scrollBy({ top: by, behavior: "smooth" });
    } else if (inside(e.target)) {
      e.preventDefault();
      scrollPage(e.key, e.shiftKey);
    }
  };

  const onFocus = (e: FocusEvent) => {
    if (!el.hasAttribute("data-overflows") || !(e.target instanceof Element)) return;
    const box = el.getBoundingClientRect();
    const r = e.target.getBoundingClientRect();
    const top = r.top - box.top + el.scrollTop;
    const to = revealTop(el.scrollTop, el.clientHeight, top, top + r.height, FOCUS_MARGIN);
    if (Math.abs(to - el.scrollTop) >= 1) el.scrollTop = to;
  };

  // Before GSAP's own listeners (on <html> and the document): the window's capture comes first.
  const capture = { capture: true, passive: true };
  window.addEventListener("wheel", onWheel, capture);
  window.addEventListener("touchstart", onTouchStart, capture);
  window.addEventListener("touchmove", onTouchMove, capture);
  window.addEventListener("touchend", onTouchEnd, capture);
  window.addEventListener("touchcancel", onTouchEnd, capture);
  window.addEventListener("keydown", onKey, { capture: true });
  el.addEventListener("focusin", onFocus);

  return {
    settle: (settled) => {
      if (settled !== el.hasAttribute("data-settled")) el.toggleAttribute("data-settled", settled);
    },
    reset: () => {
      if (el.scrollTop) el.scrollTop = 0;
    },
    dispose: () => {
      stopWatching();
      window.removeEventListener("wheel", onWheel, capture);
      window.removeEventListener("touchstart", onTouchStart, capture);
      window.removeEventListener("touchmove", onTouchMove, capture);
      window.removeEventListener("touchend", onTouchEnd, capture);
      window.removeEventListener("touchcancel", onTouchEnd, capture);
      window.removeEventListener("keydown", onKey, { capture: true });
      el.removeEventListener("focusin", onFocus);
      el.removeAttribute("data-settled");
      el.scrollTop = 0;
    },
  };
}

/**
 * Marks `el` (the first screen) with `data-tight` while it's taller than `box` (the pinned screen)
 * laid out without the mark (zoom 400%): its gaps and type tighten then (Hero.tsx). Measured without
 * the mark, so it never flips back and forth. Returns the cleanup.
 */
export function tightenToFit(el: HTMLElement | null, box: HTMLElement | null): () => void {
  if (!el || !box) return () => undefined;
  const measure = () => {
    el.removeAttribute("data-tight");
    if (el.offsetHeight > box.clientHeight + 1) el.setAttribute("data-tight", "");
  };
  const observer = new ResizeObserver(measure);
  observer.observe(box, { box: "border-box" });
  for (const child of el.children) observer.observe(child);
  return () => {
    observer.disconnect();
    el.removeAttribute("data-tight");
  };
}
