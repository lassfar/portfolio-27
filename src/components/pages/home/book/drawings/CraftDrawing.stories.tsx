import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { NODES } from "#/components/pages/home/skills/constellation";
import { overlap, renderedPx } from "#/stories/svgText";
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

/** The Craft in the calm book: the site's constellation, still, over a faint sky. Hover a node (or touch it): its halo fades in and its name turns white; nothing grows or moves (WCAG 2.3.3). */
export const Default: Story = {
  play: async ({ canvas }) => {
    for (const node of NODES) await expect(canvas.getByText(node.label)).toBeInTheDocument();
  },
};

/** On a phone (320 px wide): the names grow as the drawing shrinks, so they read at 11 px or more, still clear of each other. */
export const Phone: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320);
    const labels = [...canvasElement.querySelectorAll<SVGTextElement>("svg text")];
    await expect(labels).toHaveLength(NODES.length);
    for (const label of labels)
      await expect(renderedPx(label), label.textContent ?? "").toBeGreaterThanOrEqual(11);
    labels.forEach((a, i) =>
      labels
        .slice(i + 1)
        .forEach((b) => expect(overlap(a, b), `${a.textContent} / ${b.textContent}`).toBe(false)),
    );
  },
};
