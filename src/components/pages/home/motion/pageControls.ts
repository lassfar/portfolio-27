/**
 * Where the page's own controls live (P27-95): a `<header>` first in <body>, before the page
 * (its banner landmark, P27-101), so the Reduce motion switch is the first Tab stop (it's the
 * first thing a visitor bothered by motion needs), then "Skip to Contact". Kept above the mode
 * switch's screen (`data-mode-keep`). A plain module: the server layout reads it.
 */
export const PAGE_CONTROLS_ID = "page-controls";
