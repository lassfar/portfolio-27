import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { BOOK } from "#/components/pages/home/story/copy";
import { contrastOnPage } from "#/stories/contrast";
import { revealed, withReveal } from "#/stories/reveal";
import Ending from "./Ending";

const meta = {
  title: "Home/Book/Ending",
  component: Ending,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withReveal],
} satisfies Meta<typeof Ending>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The book's last page before Contact: one glowing dot and one line, alone. Its region is headed "You are here" for screen readers; the dot is decoration. */
export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    const region = canvas.getByRole("region", { name: BOOK.youAreHere });
    await expect(
      canvas.getByRole("heading", { level: 2, name: BOOK.youAreHere }),
    ).toBeInTheDocument();
    await expect(region.querySelector("span[aria-hidden='true']")).not.toBeNull();
    await revealed(canvasElement);
    const line = canvas.getByText(BOOK.ending);
    await expect(contrastOnPage(getComputedStyle(line).color)).toBeGreaterThanOrEqual(4.5);
  },
};
