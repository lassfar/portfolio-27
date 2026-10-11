import { PHASE_NAV, SETTLE_MS } from "#/components/pages/home/phase-nav/config";
import { journeyTrigger } from "#/stores/journeyTrigger";
import { useJourneyScroll } from "#/stores/useJourneyScroll";

/**
 * How long the journey must be still after a glide before the focus is checked (ms): the
 * assistant's own settle and return first (it gives its orb the focus back itself), then a
 * margin. Its return is tuned live (`?gui`), so it's read each time.
 */
const quietMs = () => SETTLE_MS + PHASE_NAV.hideSeconds * 1000 + 200;

/** The check comes this long after the glide at the latest (ms). */
const FOCUS_CHECK_MAX_MS = 4000;

/** Whether the focus needs a new place: it's nowhere (`<body>`), or on something hidden or inert. */
export const needsRefocus = (
  active: Element | null,
  body: Element | null,
  shown: (el: Element) => boolean,
): boolean => !active || active === body || !shown(active);

/** Shown and reachable: in the page, not inert, not `visibility: hidden` (nor `display: none`). */
const isShown = (el: Element) =>
  el.isConnected &&
  !el.closest("[inert]") &&
  // (`checkVisibility` is Safari 17.4+.)
  ("checkVisibility" in el
    ? el.checkVisibility({ visibilityProperty: true })
    : getComputedStyle(el).visibility === "visible");

let cancel: (() => void) | null = null;

/** A pending check is dropped (a new glide starts). */
export function cancelRefocusAfterGlide(): void {
  cancel?.();
}

/**
 * After a glide that started with the keyboard's focus in the page (a timeline star, the orb,
 * "To wander"): once the journey is still, a focus left on `<body>` or on something now hidden (the
 * hero's button fades out on the way; the orb hides at Contact) goes to the timeline's current
 * star (P27-99, WCAG 2.4.3). A star that keeps the focus, or the orb that takes it back, is left
 * alone.
 */
export function refocusAfterGlide(): void {
  cancel?.();
  let quiet = 0;
  const done = () => {
    window.clearTimeout(quiet);
    window.clearTimeout(latest);
    unsubscribe();
    cancel = null;
  };
  const check = () => {
    done();
    // Not once the journey has gone (a switch to the calm book, whose timeline looks the same).
    if (!journeyTrigger.current) return;
    if (!needsRefocus(document.activeElement, document.body, isShown)) return;
    document
      .querySelector<HTMLElement>('nav.story-timeline button[aria-current="step"]')
      ?.focus({ preventScroll: true });
  };
  const still = () => {
    window.clearTimeout(quiet);
    quiet = window.setTimeout(check, quietMs());
  };
  const unsubscribe = useJourneyScroll.subscribe(still);
  const latest = window.setTimeout(check, FOCUS_CHECK_MAX_MS);
  cancel = done;
  still();
}
