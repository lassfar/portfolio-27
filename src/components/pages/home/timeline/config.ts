import { solarRestRange } from "#/components/three.js/galaxy/pace";
import { JOURNEY } from "#/components/three.js/star/config";
import { CHAPTER_NAMES } from "#/components/pages/home/story/copy";
import { CHAPTER_IDS, type ChapterId } from "#/components/pages/home/story/story.types";
import type { StoryChapter } from "./StoryTimeline.types";

/**
/**
 * Where each chapter begins on the pinned journey (master progress), taken from the scroll
 * map (JOURNEY), so everything follows any re-pacing.
 */
const STARTS: Readonly<Record<ChapterId, number>> = {
  origin: 0, // the star
  maker: JOURNEY.assembleStart * JOURNEY.journeyEnd, // Saturn assembles, then About
  craft: JOURNEY.craftCoverStart,
  voyage: JOURNEY.flyAwayStart, // out to the solar system
  earth: JOURNEY.voyageEnd,
  lab: JOURNEY.earthDwellEnd, // the Parker Solar Probe
  "way-out": JOURNEY.galaxyStart, // back out to the whole system
  "milky-way": solarRestRange()[1], // out to the full galaxy
  contact: JOURNEY.contactStart,
};

/**
 * The story's chapters, in order, on the journey: shared by the timeline (one star each),
 * the always-visible story title (uppercased) and the navigation assistant's button
 * (P27-76). Their ids and names are the story's own (story/, P27-91), shared with the calm
 * book. To add a part to the story, add its id (story.types), its name (story/copy) and
 * its start here.
 */
export const STORY_CHAPTERS: readonly StoryChapter[] = CHAPTER_IDS.map((id) => ({
  id,
  name: CHAPTER_NAMES[id],
  start: STARTS[id],
}));

// The timeline's tuning lives on its own (no journey imports): the calm book's timeline reads it too.
export { TIMELINE } from "./tuning";
