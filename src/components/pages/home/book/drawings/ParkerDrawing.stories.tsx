import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import DotField from "#/components/pages/home/book/dots/DotField";
import { BOOK } from "#/components/pages/home/story/copy";
import { renderedPx } from "#/stories/svgText";
import ParkerDrawing from "./ParkerDrawing";

const meta = {
  title: "Home/Book/ParkerDrawing",
  component: ParkerDrawing,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      // As in the book: over the Sun's dots, in the same 5:4 figure.
      <DotField
        shape="sun"
        label="The Parker Solar Probe beside a big Sun, on its loops around it, each one closer."
        className="relative aspect-5/4 w-150 max-w-[90vw]"
      >
        <Story />
      </DotField>
    ),
  ],
} satisfies Meta<typeof ParkerDrawing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Lab in the calm book: Parker on its loops, each one closer, the newest in peach; the probe's heat shield faces the Sun. The pointer passes through to the Sun's dots. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg[viewBox='0 0 500 400']")!;
    await expect(svg.querySelectorAll("ellipse[rx]").length).toBeGreaterThanOrEqual(4);
    await expect(svg).toHaveTextContent(BOOK.closest);
    await expect(svg).toHaveTextContent(BOOK.probe);
    await expect(getComputedStyle(svg).pointerEvents).toBe("none");
  },
};

/** On a phone (320 px wide): its two labels ("Closest: 6.1 million km", the probe's name) grow as the drawing shrinks, so they read at 11 px or more. */
export const Phone: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320);
    const svg = canvasElement.querySelector("svg[viewBox='0 0 500 400']")!;
    const labels = [...svg.querySelectorAll<SVGTextElement>("text")];
    await expect(labels).toHaveLength(2);
    for (const label of labels)
      await expect(renderedPx(label), label.textContent ?? "").toBeGreaterThanOrEqual(11);
  },
};
