import { solarRestRange } from "#/components/three.js/galaxy/pace";
import { JOURNEY } from "#/components/three.js/star/config";
import type { StoryChapter, StoryTimelineTuning } from "./StoryTimeline.types";

/**
 * The story's chapters, in order: the ONE naming of the site, shared by the timeline (one
 * star each), the always-visible story title (uppercased) and the navigation
 * assistant's button (P27-76).
 *
 * `start` is where the chapter begins on the pinned journey, taken from the scroll map
 * (JOURNEY), so everything follows any re-pacing. To add a part to the story, add one
 * entry here.
 */
export const STORY_CHAPTERS: readonly StoryChapter[] = [
  { id: "origin", name: "Origin", start: 0 }, // the star
  { id: "maker", name: "The Maker", start: JOURNEY.assembleStart * JOURNEY.journeyEnd }, // Saturn assembles, then About
  { id: "craft", name: "The Craft", start: JOURNEY.craftCoverStart },
  { id: "voyage", name: "The Voyage", start: JOURNEY.flyAwayStart }, // out to the solar system
  { id: "earth", name: "The Earth", start: JOURNEY.voyageEnd },
  { id: "lab", name: "The Lab", start: JOURNEY.earthDwellEnd }, // the Parker Solar Probe
  { id: "way-out", name: "The Way Out", start: JOURNEY.galaxyStart }, // back out to the whole system
  { id: "milky-way", name: "The Milky Way", start: solarRestRange()[1] }, // out to the full galaxy
  { id: "contact", name: "Contact", start: JOURNEY.contactStart },
];

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
