import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import Gallery from "#/stories/Gallery";
import Swash from "./Swash";
import type { SwashFlip } from "./orient";
import { SWASH_NAMES } from "./shapes";

/** Its four orientations (`flipX`, `flipY`). */
const TURNS = {
  "as drawn": { flipX: false, flipY: false },
  mirrored: { flipX: true, flipY: false },
  "upside down": { flipX: false, flipY: true },
  "mirrored, upside down": { flipX: true, flipY: true },
} satisfies Record<string, SwashFlip>;
const TURN_NAMES = Object.keys(TURNS) as (keyof typeof TURNS)[];

const meta = {
  title: "UI/Swash",
  component: Swash,
  tags: ["autodocs"],
  argTypes: {
    shape: { control: "select", options: SWASH_NAMES },
    draw: { control: "inline-radio", options: ["mount", "cue"] },
  },
  args: { shape: "loopEnd", className: "w-75" },
} satisfies Meta<typeof Swash>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One swash drawing itself in (change a control to draw it again). Decorative: hidden from screen readers. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg");
    await expect(svg).toHaveAttribute("aria-hidden", "true");
    await expect(svg).toHaveAttribute("data-swash", "loopEnd");
    await expect(svg?.querySelector("path")).toHaveAttribute("pathLength", "1");
  },
};

/** Every shape (Aymane's pen strokes). */
export const Shapes: Story = {
  parameters: { controls: { exclude: ["shape"] } },
  render: (args) => (
    <Gallery values={SWASH_NAMES} layout="stack">
      {(shape) => <Swash {...args} shape={shape} />}
    </Gallery>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-swash]")).toHaveLength(SWASH_NAMES.length);
  },
};

/** Its four orientations, for variety: mirrored, it still draws from the left. */
export const Turned: Story = {
  parameters: { controls: { exclude: ["flipX", "flipY"] } },
  render: (args) => (
    <Gallery values={TURN_NAMES} layout="stack">
      {(turn) => <Swash {...args} {...TURNS[turn]} />}
    </Gallery>
  ),
};
