/**
 * Where the page's own controls live (P27-95): a container first in <body>, before the page,
 * so the Reduce motion switch is the first Tab stop (it's the first thing a visitor bothered
 * by motion needs). Kept above the mode switch's screen (`data-mode-keep`). A plain module:
 * the server layout reads it.
 */
export const PAGE_CONTROLS_ID = "page-controls";
