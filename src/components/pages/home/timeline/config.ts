import { solarRestRange } from "#/components/three.js/galaxy/pace";
import { JOURNEY } from "#/components/three.js/star/config";
import { CHAPTER_NAMES } from "#/components/pages/home/story/copy";
import { CHAPTER_IDS, type ChapterId } from "#/components/pages/home/story/story.types";
import type { StoryChapter, StoryTimelineTuning } from "./StoryTimeline.types";

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

/**
 * The timeline's look and behaviour, as tuned in the P27-73 sketch. Mutable: the dev
 * panel (TimelineGui, `?gui`) edits it live; "copy values" gives the JSON to bake in here.
 */
export const TIMELINE: StoryTimelineTuning = {
  position: "center right", // any edge or corner of the screen
  orientation: "vertical", // auto: horizontal at the top / bottom centre, vertical elsewhere
  edge: 25, // px from the screen edge to the rail line (0 = flush); to the rail's end in a corner
  railLength: 35, // % of the screen along the rail (vh vertical, vw horizontal)
  railWidth: 3, // px
  color: "custom", // the fill, passed + current marks, glow (a design-system colour, or "custom")
  customColor: "#585555", // used when a colour is "custom"
  railColor: "gray-slate", // the unfilled rail + upcoming stars
  customRailColor: "#d9d9d9",
  tipColor: "light-peach", // the tooltip + name pill's text
  customTipColor: "#ffe3c7",
  shape: "star", // each chapter's mark: star | circle | diamond | tick | orbit | capsule
  upcoming: "hollow", // marks not reached yet: dim (soft fill) | hollow (outline)
  starSize: 2, // px: each chapter's mark (a star's rays reach ~1.9× this)
  currentSize: 8, // px: the current chapter's mark
  glow: 0, // the current star's glow (0..1)
  pulse: true, // …breathing slowly
  railAlpha: 0.1, // the unfilled rail (gray-slate; 0 = only the peach fill shows)
  upcomingAlpha: 0, // stars not reached yet (0 = hidden until you get there)
  minGap: 35, // px: stars sit by each chapter's scroll length, never closer than this
  showAfter: 100, // scroll %: hidden on the hero's first screen
  dimAfter: 1.5, // s without scrolling before it dims…
  dimOpacity: 0.55, // …to this
  hideAfter: 0, // s after dimming before it hides too (0 = never)
  glideSeconds: 1.5, // clicking a star glides to its chapter
  glideInside: 3, // scroll %: …landing just inside it
  nameOnChange: false, // a new chapter's name pops up by its star (always on phones)
  nameSeconds: 1.8,
  phoneMaxWidth: 767, // px: phones have no hover tooltips (the name pops up on change instead)
};
