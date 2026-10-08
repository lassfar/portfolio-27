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
  thanks: {
    title: "*Thank you*",
    line: "Your message is on its way. I’ll write back soon.",
    again: "Write another",
  },
} as const;

/** The calm book's own words (P27-93): the marks on its dotted shapes. */
export const BOOK = {
  youAreHere: "You are here",
} as const;
