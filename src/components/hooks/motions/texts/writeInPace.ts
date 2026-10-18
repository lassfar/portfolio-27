/**
 * The scroll write-in's pace within each element's share of it (`addTextsScrollWriteIn`): its words
 * start one after another over the first `stagger` of the share, each fading in over `fade`. Shared
 * with what follows the writing (P27-102: pages/home/scroll/overlayScroll `writingAt`).
 */
export const WRITE_IN_PACE = { stagger: 0.55, fade: 0.45 } as const;
