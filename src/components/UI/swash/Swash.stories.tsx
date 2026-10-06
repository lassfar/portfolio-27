import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import Swash from "./Swash";
import { SWASH_NAMES } from "./shapes";

const meta = {
  title: "UI/Swash",
  component: Swash,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#19191C" }] }, // --color-rich-black
  },
  decorators: [
    (Story) => (
      <div className="p-10">
        <Story />
      </div>
    ),
  ],
  argTypes: { shape: { control: "select", options: SWASH_NAMES } },
  args: { shape: "loopEnd", className: "w-75" },
} satisfies Meta<typeof Swash>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One swash, drawing itself in (reload the story to see it again). */
export const LoopEnd: Story = {
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg");
    await expect(svg).toHaveAttribute("aria-hidden", "true");
    await expect(svg).toHaveAttribute("data-swash", "loopEnd");
    await expect(canvasElement.querySelector("path")).toHaveAttribute("pathLength", "1");
  },
};

export const LoopStart: Story = { args: { shape: "loopStart" } };

export const LoopMiddle: Story = { args: { shape: "loopMiddle" } };

/** Every shape under a title (each title has its own: pages/home/swashes.ts). */
export const UnderTitles: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-14">
      {SWASH_NAMES.map((shape) => (
        <div key={shape} className="flex flex-col items-center">
          <p className="mb-1 font-great-vibes text-6xl leading-none text-white">
            Say <span className="text-peach">Hello</span>
          </p>
          <Swash shape={shape} className="w-64" />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-swash]")).toHaveLength(SWASH_NAMES.length);
  },
};

/** Turned for variety: as drawn, mirrored, upside down, both (mirrored, it still draws from the left). */
export const Turned: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-x-12 gap-y-10">
      {SWASH_NAMES.flatMap((shape) =>
        [
          [false, false],
          [true, false],
          [false, true],
          [true, true],
        ].map(([flipX, flipY]) => (
          <figure key={`${shape}-${flipX}-${flipY}`} className="flex flex-col gap-2">
            <Swash shape={shape} flipX={flipX} flipY={flipY} className="w-60" />
            <figcaption className="text-2xs text-white/40">
              {shape}
              {flipX ? " · mirrored" : ""}
              {flipY ? " · upside down" : ""}
            </figcaption>
          </figure>
        )),
      )}
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("[data-swash]")).toHaveLength(SWASH_NAMES.length * 4);
  },
};
