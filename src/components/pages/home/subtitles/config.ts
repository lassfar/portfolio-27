import { STORY_CHAPTERS } from "#/components/pages/home/timeline/config";
import { JOURNEY } from "#/components/three.js/star/config";
import { LAB } from "#/components/three.js/voyager/config";
import type { StorySubtitle, SubtitlePlacement } from "./subtitles.types";

const jp = (x: number) => x * JOURNEY.journeyEnd; // journey progress (the star → About block) → mp
const labMp = (lab: number) => JOURNEY.earthDwellEnd + lab * (JOURNEY.galaxyStart - JOURNEY.earthDwellEnd); // Lab progress → mp

/** Where the subtitles sit, unless a line has its own `placement`. */
export const SUBTITLE_PLACEMENT: SubtitlePlacement = "bottom-left";

/** How far into its chapter a line starts (0..1): the chapter's own motion sets off first. */
export const SUBTITLE_START = 0.35;

/** Where chapter `id` runs on the journey (master progress): from its start to the next one's. */
function chapter(id: string): [number, number] {
  const i = STORY_CHAPTERS.findIndex((c) => c.id === id);
  if (i < 0) throw new Error(`No chapter "${id}"`);
  return [STORY_CHAPTERS[i].start, STORY_CHAPTERS[i + 1]?.start ?? 1];
}

/** A line's window in chapter `id`: from SUBTITLE_START into it, to its end (or `end`). */
function phase(id: string, end?: number): [number, number] {
  const [from, to] = chapter(id);
  return [from + SUBTITLE_START * (to - from), end ?? to];
}

/**
 * The story's subtitles (P27-79): a line in Aymane's voice for each part of the scroll
 * with no words of its own — the hero, the About, the Craft and Contact have their text.
 * Each shows through its chapter (the user: long enough to read at any pace, the same
 * story for everyone) — from SUBTITLE_START (35%) into it, once its motion has set off,
 * to its end, or to where a text of its own takes over. Taken from
 * the chapters (STORY_CHAPTERS), they follow any change to the scroll map. The scroll
 * only decides which line shows: it then fades in over its own time (StorySubtitles).
 */
export const STORY_SUBTITLES: readonly StorySubtitle[] = [
  {
    // Origin: the star bursts, once the hero copy has lifted away, until Saturn starts.
    id: "star",
    line: "Before anything takes shape, it has to *come apart*.",
    window: [Math.max(phase("origin")[0], jp(JOURNEY.contentExit)), phase("origin")[1]],
    enabled: true,
    onAssistantGlide: true,
  },
  {
    // The Maker: Saturn finished, until the About text slides in — not while the
    // assistant glides through to that text (the Maker has its own section).
    id: "saturn",
    line: "*Dot by dot.* I've never known another way to make something.",
    window: phase("maker", jp(JOURNEY.revealStart)),
    enabled: true,
    onAssistantGlide: false,
  },
  {
    id: "voyage", // The Voyage: Saturn flies away, out to the wide view of the Sun, and the dive
    line: "I like to zoom out. That's where *the small things* start to make sense.",
    window: phase("voyage"),
    enabled: true,
    onAssistantGlide: true,
  },
  {
    // The Earth: its whole rest (one screen, too short from 35% in), then on into the
    // Lab's pull-back while the Earth is still in view — until its pins and daylight
    // hand off (LAB.earthFadeEnd), well before the Lab's own line.
    id: "earth",
    line: "Wherever I go, I carry a camera, not to keep the places, but *the light*.",
    window: [chapter("earth")[0], labMp(LAB.earthFadeEnd)],
    enabled: true,
    onAssistantGlide: true,
  },
  {
    id: "lab", // The Lab: Parker's journey, the flight to the probe, its close-up
    line: "It never flies straight at the Sun. It loops — and every loop takes it *a little closer*. That's how I learn.",
    window: phase("lab"),
    enabled: true,
    onAssistantGlide: true,
  },
  {
    id: "way-out", // The Way Out: back from the probe to the whole solar system
    line: "Up close, it's all details. From here, it's *one quiet system*. That's what I try to build.",
    window: phase("way-out"),
    enabled: true,
    onAssistantGlide: true,
  },
  {
    id: "milky-way", // The Milky Way: out to the whole galaxy, handing over to the Contact form
    line: "A hundred billion stars, and we still *find each other*.",
    window: phase("milky-way"),
    enabled: true,
    onAssistantGlide: true,
  },
];

/**
 * The line showing at master progress `mp` (its index), or -1 between them — or if it's
 * off, or the assistant is gliding through a line kept out of its glides.
 */
export function subtitleAt(mp: number, assistantGlide = false): number {
  return STORY_SUBTITLES.findIndex(
    ({ window: [from, to], enabled, onAssistantGlide }) =>
      enabled && (onAssistantGlide || !assistantGlide) && mp > from && mp < to,
  );
}

/**
 * The subtitles' pace (the user, P27-79): a line fades in as its window begins and
 * stays through it, fading out as it ends. Only a very fast
 * jump (a glide, a dragged scroll bar) passes a chapter without starting its line; none
 * shows on the way back up (they tell the story forward), and each shows once per visit.
 */
export const SUBTITLE_PACE = {
  fadeMs: 700, // fading in, and out
  maxSpeed: 800, // scroll % per second: faster than this, a line doesn't start
  settleMs: 200, // no scroll for this long counts as stopped
  onScrollBack: false, // shown while scrolling back up (off: hidden until you scroll forward again)
  onceEach: true, // each line shows once per visit (off: again each time you scroll into it)
};

/**
 * The line to show at `mp`, scrolling at `speed` (scroll %/s), with `current` showing —
 * during an assistant glide (`assistantGlide`) or not, last scrolling back up
 * (`backward`) or not, the lines already shown in this visit being `seen`.
 */
export function nextSubtitle(
  current: number,
  mp: number,
  speed: number,
  assistantGlide = false,
  backward = false,
  seen: ReadonlySet<number> = new Set(),
): number {
  if (backward && !SUBTITLE_PACE.onScrollBack) return -1;
  const at = subtitleAt(mp, assistantGlide);
  if (at < 0) return -1;
  if (at !== current && SUBTITLE_PACE.onceEach && seen.has(at)) return -1;
  return at === current || speed <= SUBTITLE_PACE.maxSpeed ? at : -1;
}
