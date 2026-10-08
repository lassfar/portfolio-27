import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { BRIDGES } from "#/components/pages/home/story/copy";
import { revealed, withReveal } from "#/stories/reveal";
import Bridge from "./Bridge";

const meta = {
  title: "Home/Book/Bridge",
  component: Bridge,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [withReveal],
  argTypes: { after: { control: "select", options: BRIDGES.map((b) => b.after) } },
  args: { after: "origin" },
} satisfies Meta<typeof Bridge>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Between two chapters: a line in Aymane's voice, saying what the motion used to show. */
export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByText(BRIDGES[0].lines[0])).toBeInTheDocument();
    await revealed(canvasElement);
  },
};

/** A passage (here The Voyage, no longer a chapter in the book): its voice line between the bridge's two lines. */
export const Passage: Story = {
  args: { after: "craft" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll("p")).toHaveLength(3);
    await expect(canvasElement).toHaveTextContent("I like to zoom out.");
    await revealed(canvasElement);
  },
};
