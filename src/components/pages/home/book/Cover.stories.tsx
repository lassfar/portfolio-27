import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { titleId } from "#/components/pages/home/book/chapters";
import { HERO } from "#/components/pages/home/story/copy";
import { contrastOnPage } from "#/stories/contrast";
import { inCalm } from "#/stories/motion";
import { sideways } from "#/stories/viewports";
import Cover from "./Cover";

const meta = {
  title: "Home/Book/Cover",
  component: Cover,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  beforeEach: inCalm,
} satisfies Meta<typeof Cover>;

export default meta;

type Story = StoryObj<typeof meta>;

const title = () => document.getElementById(titleId("origin"))!;

/** The book's cover, Origin: the star filling the screen, the words below it. The section is named by its title (the page's one h1), which takes the focus when the timeline jumps here; its small capitals read at 4.5:1 or more over their soft shade (WCAG 1.4.3). */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("region", { name: /A quiet maker of/ })).toBeInTheDocument();
    await expect(title().tagName).toBe("H1");
    await expect(title()).toHaveAttribute("tabindex", "-1");
    const eyebrow = canvas.getByText(HERO.eyebrow);
    await waitFor(() => expect(getComputedStyle(eyebrow.parentElement!).opacity).toBe("1"));
    await expect(contrastOnPage(getComputedStyle(eyebrow).color)).toBeGreaterThanOrEqual(4.5);
  },
};

/** On a phone held sideways (568 × 320): the star is smaller and the words come up, so the title is on the first screen. */
export const ShortScreen: Story = {
  ...sideways,
  play: async () => {
    await expect(window.innerHeight).toBe(320);
    await expect(title().getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight);
  },
};
