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
    // Not a place of its own: nothing to land on or focus.
    await expect(canvas.queryByRole("group")).toBeNull();
    await revealed(canvasElement);
  },
};

/** A passage (here The Voyage, no longer a chapter in the book): its voice line between the bridge's two lines. The bridge is the passage's place in the book: a mode switch lands there and focuses it, named after it. */
export const Passage: Story = {
  args: { after: "craft" },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvasElement.querySelectorAll("p")).toHaveLength(3);
    await expect(canvasElement).toHaveTextContent("I like to zoom out.");
    const place = canvas.getByRole("group", { name: "The Voyage" });
    await expect(place).toHaveAttribute("id", "voyage");
    await expect(place).toHaveAttribute("tabindex", "-1");
    await revealed(canvasElement);
  },
};
