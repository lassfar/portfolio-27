import type { ButtonSize, ButtonVariant } from "#/components/UI/buttons/button.types";
import { solarRestRange } from "#/components/three.js/galaxy/pace";
import { VOYAGE } from "#/components/three.js/solar/config";
import { JOURNEY, mpAt } from "#/components/three.js/star/config";
import { LAB } from "#/components/three.js/voyager/config";
import { CHAPTER_NAMES } from "#/components/pages/home/story/copy";
import type { ChapterId } from "#/components/pages/home/story/story.types";

/** One resting point of the story, where a button offers the next one. */
export type PhaseStop = {
  id: ChapterId;
  /** Its title: the label of the button that leads here. */
  name: string;
  /** Where its button shows ([from, to) master progress); null = no button (the end). */
  window: [number, number] | null;
  /** Where a glide to it lands (master progress). */
  target: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const jp = (x: number) => x * JOURNEY.journeyEnd; // journey progress (the About block) → mp
const voyageAt = (v: number) =>
  lerp(JOURNEY.flyAwayStart, JOURNEY.voyageEnd, v);
const labMp = (l: number) =>
  lerp(JOURNEY.earthDwellEnd, JOURNEY.galaxyStart, l);
const [solarRestStart, solarRestEnd] = solarRestRange();

/**
 * The story's resting points, in order, taken from the scroll map. At each one, a
 * button offers the next ("The Craft", "The Earth"…) and glides there. The hero has its
 * own "To wander", so the chain starts at Saturn.
 */
export const PHASE_STOPS: readonly PhaseStop[] = [
  {
    id: "maker", // the About text, fully coloured in
    name: CHAPTER_NAMES.maker,
    window: [
      jp(lerp(JOURNEY.fillStart, JOURNEY.exitStart, 0.6)),
      jp(JOURNEY.exitStart),
    ],
    target: jp(JOURNEY.exitStart) - mpAt(8),
  },
  {
    id: "craft", // the constellation, assembled
    name: CHAPTER_NAMES.craft,
    window: [JOURNEY.constellationEnd - mpAt(80), JOURNEY.craftFadeStart],
    target: JOURNEY.craftFadeStart - mpAt(5),
  },
  {
    id: "voyage", // the wide, Sun-centred view
    name: CHAPTER_NAMES.voyage,
    window: [
      voyageAt(VOYAGE.flyoutEnd - 0.08),
      voyageAt(VOYAGE.flyoutEnd + 0.04),
    ],
    target: voyageAt(VOYAGE.flyoutEnd),
  },
  {
    id: "earth", // the Earth up close (its dwell)
    name: CHAPTER_NAMES.earth,
    window: [JOURNEY.voyageEnd, JOURNEY.earthDwellEnd],
    target: lerp(JOURNEY.voyageEnd, JOURNEY.earthDwellEnd, 0.5),
  },
  {
    id: "lab", // the Parker Solar Probe's close-up
    name: CHAPTER_NAMES.lab,
    window: [labMp(LAB.recordLabelAt), JOURNEY.galaxyStart],
    target: labMp((LAB.recordLabelAt + 1) / 2), // the middle of the close-up's pause
  },
  {
    id: "way-out", // the finale's rest on the whole solar system
    name: CHAPTER_NAMES["way-out"],
    window: [
      solarRestStart - 0.03 * (solarRestStart - JOURNEY.galaxyStart),
      solarRestEnd,
    ],
    target: lerp(solarRestStart, solarRestEnd, 0.5),
  },
  {
    id: "milky-way", // the full galaxy
    name: CHAPTER_NAMES["milky-way"],
    window: [JOURNEY.galaxyEnd, JOURNEY.contactStart],
    target: JOURNEY.galaxyEnd + mpAt(5),
  },
  {
    id: "contact", // the form: the end
    name: CHAPTER_NAMES.contact,
    window: null,
    target: JOURNEY.contactEnd,
  },
];

/** The button's tones the orb can grow into (its landing colours, useReveal). */
export type AssistantVariant = Extract<ButtonVariant, "outline" | "primary">;

/**
 * The navigation assistant (a glowing orb at the bottom of the screen that opens into
 * the next chapter's button) and its glide. Mutable: the dev panel (`?gui` → "Navigation
 * assistant") edits it. A glide's length follows the distance: `secondsPerScreen` per
 * 100% of scroll, kept within [minSeconds, maxSeconds].
 */
export const PHASE_NAV = {
  variant: "outline" as AssistantVariant, // the revealed UI/Button (Storybook)
  size: "large" as ButtonSize,
  orbSize: 16, // px
  revealSeconds: 0.6, // the orb → button morph (the label writes in after it); reversed the same, calmly
  autoCloseSeconds: 6, // an unused button (opened by a tap / Enter) folds back after this long
  hoverOpenDelay: 0.12, // desktop: the mouse opens it after resting this long (s)…
  hoverCloseDelay: 2, // …and leaving folds it back after this grace (s)
  hideSeconds: 0.5, // out of the way while the story glides (P27-85): it shrinks…
  hideScale: 0.2, // …to this size…
  hideDrop: 72, // …and drops this far (px), below the screen's edge; it plays back after the glide
  secondsPerScreen: 1,
  minSeconds: 1.5,
  maxSeconds: 8,
  // The scroll → motion curves already ease each beat (e.g. the finale's slow → fast →
  // slow), so an even-paced scroll ("none") plays them as they are.
  ease: "none" as string,
};

/**
 * The stop the assistant offers at master progress `mp`: at a rest, the next one;
 * elsewhere, the first rest ahead (mid-voyage → the Earth). None once Contact begins.
 */
export function nextStopAt(mp: number): PhaseStop | null {
  if (mp >= JOURNEY.contactStart) return null;
  const at = PHASE_STOPS.findIndex(
    (s) => s.window !== null && mp >= s.window[0] && mp < s.window[1],
  );
  if (at >= 0) return PHASE_STOPS[at + 1] ?? null;
  return PHASE_STOPS.find((s) => s.target > mp) ?? null;
}

/** How long a glide over `distance` (master progress) takes. */
export function glideSeconds(distance: number): number {
  const screens = Math.abs(distance) / mpAt(100);
  return Math.min(
    PHASE_NAV.maxSeconds,
    Math.max(PHASE_NAV.minSeconds, screens * PHASE_NAV.secondsPerScreen),
  );
}
