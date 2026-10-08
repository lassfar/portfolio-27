/**
 * Escape closes the tooltip on screen (WCAG 1.4.13, P27-92): `data-tooltips="off"` on
 * <html> hides every tooltip (the `tooltips-off:` variant) until its trigger is neither
 * hovered nor focused any more, or the pointer or the focus reaches another trigger. So it
 * can be dismissed without moving the pointer or the focus, and shows again next time. One
 * set of listeners for the page, started once in the browser.
 */
const TRIGGER = ".group\\/tip"; // a tooltip's trigger (Tooltip: `group/tip`)

/** The trigger the tooltips were closed on (null: none was hovered or focused). */
let closedOn: Element | null = null;
/** The trigger under the pointer. */
let hovered: Element | null = null;

const triggerOf = (target: EventTarget | null) =>
  target instanceof Element ? target.closest(TRIGGER) : null;

function close(event: KeyboardEvent): void {
  if (event.key !== "Escape") return;
  closedOn = triggerOf(document.activeElement) ?? hovered;
  document.documentElement.dataset.tooltips = "off";
}

function open(): void {
  delete document.documentElement.dataset.tooltips;
  closedOn = null;
}

/** The pointer or the focus reaches `target`: on another trigger, the tooltips show again. */
function reach(target: EventTarget | null): void {
  if (document.documentElement.dataset.tooltips !== "off") return;
  if (triggerOf(target) !== closedOn) open();
}

/** The pointer or the focus left: once the closed trigger is neither hovered nor focused, they show again. */
function leave(): void {
  // Only while a tooltip is closed (P27-95: not a frame for every pointer that leaves something).
  if (document.documentElement.dataset.tooltips !== "off") return;
  // After the event: the focus and the hover have moved by then.
  requestAnimationFrame(() => {
    if (document.documentElement.dataset.tooltips !== "off") return;
    if (closedOn?.matches(":hover") || closedOn?.contains(document.activeElement)) return;
    open();
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("keydown", close, { capture: true });
  window.addEventListener("pointerover", (event) => {
    hovered = triggerOf(event.target);
    reach(event.target);
  });
  window.addEventListener("focusin", (event) => reach(event.target));
  window.addEventListener("pointerout", leave);
  window.addEventListener("focusout", leave);
}
