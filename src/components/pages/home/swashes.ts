import type { SwashPick } from "#/components/UI/swash/orient";

/**
 * The swash under each title (P27-83, chosen by Aymane): drawing 1 under the Maker's (as
 * drawn) and the Craft's (turned: mirrored + upside down), drawing 2 turned under Contact's,
 * the first one in the panels. Spread on a Swash: `<Swash {...TITLE_SWASH.maker} />`.
 */
export const TITLE_SWASH = {
  maker: { shape: "loopStart", flipX: false, flipY: false },
  craft: { shape: "loopStart", flipX: true, flipY: true },
  contact: { shape: "loopMiddle", flipX: true, flipY: true },
  panel: { shape: "loopEnd", flipX: false, flipY: false },
} as const satisfies Record<string, SwashPick>;
