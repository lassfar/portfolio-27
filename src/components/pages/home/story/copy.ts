import type { ChapterId } from "./story.types";

/**
 * The story's words (P27-91), in one place for both ways of telling it: the 3D journey
 * and the calm book (reduced motion). Type imports only, so the book reads them without
 * loading any of the 3D. `*word*` marks a word in peach (UI/text/accent).
 *
 * Also part of the story, kept beside their data (they import nothing either): the
 * places (three.js/earth/data.ts) and the Lab's card (three.js/voyager/data.ts).
 */

/** Each chapter's name: the timeline, the story title, the assistant's button. */
export const CHAPTER_NAMES: Readonly<Record<ChapterId, string>> = {
  origin: "Origin",
  maker: "The Maker",
  craft: "The Craft",
  voyage: "The Voyage",
  earth: "The Earth",
  lab: "The Lab",
  "way-out": "The Way Out",
  "milky-way": "The Milky Way",
  contact: "Contact",
};

/** The journey's chapters the calm book tells as passages between its own: through their voice. */
export const PASSAGES: readonly ChapterId[] = ["voyage", "way-out"];

/** A line in Aymane's voice for each part with no words of its own (the journey's subtitles). */
export const VOICE = {
  origin: "Before anything takes shape, it has to *come apart*.",
  maker: "*Dot by dot.* I've never known another way to make something.",
  voyage: "I like to zoom out. That's where *the small things* start to make sense.",
  earth: "Wherever I go, I carry a camera, not to keep the places, but *the light*.",
  lab: "It never flies straight at the Sun. It loops — and every loop takes it *a little closer*. That's how I learn.",
  "way-out":
    "Up close, it's all details. From here, it's *one quiet system*. That's what I try to build.",
  "milky-way": "A hundred billion stars, and we still *find each other*.",
} as const satisfies Partial<Record<ChapterId, string>>;

/** Origin: the hero. */
export const HERO = {
  eyebrow: "I’m Aymane —",
  headline: "A quiet maker of *Small Universes*",
  intro: "I notice light. I’ve been drawing since before I could write. Now I do it with code.",
  cta: "To wander",
} as const;

/** The Maker: the About. */
export const ABOUT = {
  title: "Small, Patient *Details*",
  paragraphs: [
    "I don’t fill rooms — I notice them. I’ve always been the quiet one, more at home watching than performing. That’s where the work comes from: a love of small, patient details — the right easing curve, the soft edge of a shadow, the moment a page finally breathes.",
    "I build the way I drew as a kid: slowly, and for the love of it. Only now, other people get to live inside what I make. I care less about looking impressive than about being honest — quiet interfaces that feel considered, and a little bit alive.",
  ],
} as const;

/** The Craft: its title and intro (the constellation itself: skills/constellation.ts). */
export const CRAFT = {
  title: "What I’m *drawn to*",
  intro:
    "The tools I reach for and the things that pull my eye — connected, because the way I see is the way I build.",
  constellationLabel: "An organic constellation of my tools and creative pulls",
} as const;

/** Contact: the form's words. */
export const CONTACT = {
  title: "Say *Hello*",
  intro:
    "Parker carries over a million names toward the Sun. Leave yours here, and I’ll write back.",
  fields: {
    name: { label: "Name", placeholder: "Your name" },
    email: { label: "Email", placeholder: "you@somewhere.com" },
    message: { label: "Message", placeholder: "A project, a question, or just hello." },
  },
  send: "Send it",
  sending: "Sending…",
  /** When a message didn't go through (P27-66): it stays in the form; the link opens their mail app with it. */
  failed: {
    line: "It didn’t go through, the connection maybe. Try again, or",
    email: "email it to me",
    subject: "Hello from your portfolio",
  },
  thanks: {
    title: "*Thank you*",
    line: "Your message is on its way. I’ll write back soon.",
    again: "Write another",
  },
} as const;

/**
 * The calm book's own words (P27-93): what the journey shows in motion, told in a line, and
 * the words around its figures. Its chapters' own words are the journey's (above).
 */
export const BOOK = {
  /** Over a chapter: "Chapter 2 · The Maker". */
  chapter: "Chapter",
  /** Under the cover's words. */
  hint: "Scroll to read · seven short chapters",
  /** The chapters titled by their figure alone in the journey. */
  titles: {
    earth: "The *Earth*",
    lab: "The *Lab*",
    "milky-way": "The Milky *Way*",
  },
  /** The Craft's second paragraph: how to read its constellation. */
  craftKey:
    "Up top, what pulls my eye: photography, drawing, motion. Below, the tools I build with: React, TypeScript, Next.js, GSAP. In the middle, where they meet: Three.js.",
  /** A place's chip: how many shots it holds. */
  shots: "shots",
  /** The Lab's chip. */
  lab: { name: "Memory card", meta: "open the Lab" },
  /** The book's last line, alone on its page before Contact. */
  ending: "And somewhere in all of it, you’re reading this.",
  youAreHere: "You are here",
  closest: "Closest: 6.1 million km",
  probe: "Parker Solar Probe",
  /** What each figure shows, for screen readers. */
  figures: {
    star: "A star drawn in dots: a white-hot core warming to peach, golden dust around it, and four long points of light.",
    saturn: "Saturn drawn in dots: peach bands on the planet, its rings tilted around it.",
    craft:
      "A constellation of what I am drawn to: Photography, Drawing and Motion above; React, TypeScript, Next.js and GSAP below; Three.js / R3F in the middle, where they meet.",
    earth:
      "The Earth drawn in dots: peach continents, blue oceans, and pins on London, the New Forest and Morocco.",
    lab: "The Parker Solar Probe beside a big Sun, on its loops around it, each one closer: the closest passes 6.1 million km from the Sun.",
    galaxy:
      "The Milky Way drawn in dots: a warm core, spiral arms of peach and blue, and one dot marked “You are here”.",
  },
} as const;

/**
 * The transition screen between the modes (P27-94): a line in Aymane's voice, by the mode it
 * goes to, and where the visitor lands: "Chapter 4 of 7 · Reduce motion on".
 */
export const SWITCH = {
  line: { calm: "Same story, *quieter*.", full: "Back to the *whole journey*." },
  /** The switch's state after it, as its tooltip says it. */
  state: { calm: "Reduce motion on", full: "Reduce motion off" },
  chapter: "Chapter",
  of: "of",
  /** A passage, in the book: "Between chapters 3 and 4". */
  between: "Between chapters",
  and: "and",
  /** While the 3D takes its time. */
  slow: "Bringing the 3D in…",
} as const;

/** A bridge: one or two lines after a chapter; a passage sits between the two, in its voice. */
type Bridge = {
  after: ChapterId;
  lines: readonly [string] | readonly [string, string];
  passage?: ChapterId;
};

/**
 * The calm book's bridges (P27-93): between its chapters, a line in Aymane's voice says what
 * the motion used to show. The Voyage and The Way Out aren't chapters in the book: their
 * voice lines sit between their bridge's two lines.
 */
export const BRIDGES = [
  { after: "origin", lines: ["A star burst. From its dust, a planet took shape."] },
  { after: "maker", lines: ["Every world is made of smaller things. These are mine."] },
  {
    after: "craft",
    passage: "voyage",
    lines: [
      "Then I stepped back, far enough to see the whole system.",
      "Down to the third planet: the places I carry with me.",
    ],
  },
  { after: "earth", lines: ["Out past the Earth, a small probe keeps looping toward the Sun."] },
  {
    after: "lab",
    passage: "way-out",
    lines: [
      "From the probe, back out to the whole system.",
      "Further still, until the Sun is one star among billions.",
    ],
  },
] as const satisfies readonly Bridge[];
