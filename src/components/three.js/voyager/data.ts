/**
 * The Lab's experiments — the cards carried on the Parker Solar Probe's memory card, shown
 * in the scene's panel when the card's label is clicked (LabContent, P27-80).
 *
 * M4a ships these as elegant placeholders. M4b turns the first one ("worlds")
 * `live` and lazy-mounts its own R3F canvas (the parked worlds-solar-system scene,
 * P27-47) via `next/dynamic({ ssr: false })`.
 */
export type Experiment = {
  id: string;
  title: string;
  blurb: string;
  status: "live" | "soon";
};

export const EXPERIMENTS: Experiment[] = [
  {
    id: "worlds",
    title: "Worlds",
    blurb: "A little solar system, turning in the dark.",
    status: "soon",
  },
  {
    id: "shader",
    title: "Shader study",
    blurb: "Noise, light, and grain.",
    status: "soon",
  },
  {
    id: "motion",
    title: "Motion sketch",
    blurb: "A small experiment in easing.",
    status: "soon",
  },
];

/** The Lab panel's words (its title's key word in peach, between asterisks). */
export const LAB_PANEL = {
  eyebrow: { place: "Parker Solar Probe", detail: "6.1 million km from the Sun" },
  title: "On the *Card*",
  blurb:
    "Small experiments in motion, shaders and code — carried on Parker’s memory card, beside 1.1 million names, closer to the Sun than anything we’ve ever built. More will drift into orbit soon.",
  cardTag: "On Parker’s memory card",
} as const;
