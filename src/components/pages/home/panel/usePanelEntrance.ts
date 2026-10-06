"use client";

import type { RefObject } from "react";
import useRiseInMotion from "#/components/hooks/motions/blocks/useRiseInMotion";
import { addSwashDraw } from "#/components/UI/swash/drawSwash";
import { DRAW_AFTER_RISE } from "./layout";

/**
 * A panel's entrance, on each new content (`key`): one GSAP timeline — its parts (`RISE`)
 * rise in one after another, and its swash draws as it rises. ScenePanel, and the header's
 * stories (its swash waits for this: `draw="cue"`).
 */
export const usePanelEntrance = (content: RefObject<HTMLElement | null>, key: unknown) =>
  useRiseInMotion({
    scope: content,
    selector: "[data-rise], [data-swash]",
    extend: (timeline, riseAt) => {
      const swash = content.current?.querySelector("[data-swash]") ?? null;
      if (swash) addSwashDraw(timeline, swash, riseAt(swash) + DRAW_AFTER_RISE);
    },
    dependencies: [key],
  });
