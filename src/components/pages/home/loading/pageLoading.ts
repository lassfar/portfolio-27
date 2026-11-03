/**
 * The loading screen's state (P27-115): <html data-loading>, set by the head script in full
 * motion and removed once the journey is drawn (useLoadProgress) or by its fail-safe. Plain DOM,
 * so the journey's own code can wait on it (the hero's intro plays once it's lifted).
 */

/** Whether the loading screen covers the page now. */
export const isPageLoading = (): boolean => document.documentElement.hasAttribute("data-loading");

/** Lifts the loading screen (it fades out, the journey shows). */
export const endPageLoading = (): void => document.documentElement.removeAttribute("data-loading");

/** Resolves once the loading screen has lifted: at once if it isn't up (a later mount). */
export function pageLoaded(): Promise<void> {
  if (!isPageLoading()) return Promise.resolve();
  return new Promise((resolve) => {
    const watch = new MutationObserver(() => {
      if (isPageLoading()) return;
      watch.disconnect();
      resolve();
    });
    watch.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-loading"],
    });
  });
}
