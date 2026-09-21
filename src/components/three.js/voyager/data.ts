/**
 * The Lab's experiments — the tiles carried on Voyager's Golden Record, opened
 * from the DOM experiments panel (ExperimentsPanel).
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
