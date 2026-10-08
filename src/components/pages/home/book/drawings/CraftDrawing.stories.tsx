import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { NODES } from "#/components/pages/home/skills/constellation";
import CraftDrawing from "./CraftDrawing";

const meta = {
  title: "Home/Book/CraftDrawing",
  component: CraftDrawing,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      // The book's figure: 5:4, one image for screen readers.
      <figure
        role="img"
        aria-label="A constellation of what I am drawn to"
        className="relative m-0 aspect-5/4 w-150 max-w-[90vw]"
      >
        <Story />
      </figure>
    ),
  ],
} satisfies Meta<typeof CraftDrawing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Craft in the calm book: the site's constellation, still, over a faint sky. Hover a node: its halo fades in and its name turns white; nothing grows or moves (WCAG 2.3.3). */
export const Default: Story = {
  play: async ({ canvas }) => {
    for (const node of NODES) await expect(canvas.getByText(node.label)).toBeInTheDocument();
  },
};
