import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { LOGO_ALT } from "#/components/pages/home/story/copy";
import { contrastOnPage } from "#/stories/contrast";
import PageLogo from "./PageLogo";

/** Marks <html> as the page marks it, for one story. */
const marked =
  (name: string, value = "") =>
  () => {
    document.documentElement.setAttribute(name, value);
    return () => document.documentElement.removeAttribute(name);
  };

/** The site's logo, as the layout places it: fixed to the top-left corner, a link back to the top. */
const meta = {
  title: "Home/PageLogo",
  component: PageLogo,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "8rem" } },
  },
} satisfies Meta<typeof PageLogo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A link named by its image's alt, to the top (without JS, the book's cover). The image keeps its real size's room, and is sized by CSS. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: LOGO_ALT });
    await expect(link).toHaveAttribute("href", "#origin");
    const image = canvas.getByRole("img", { name: LOGO_ALT });
    await expect(image).toHaveAttribute("width", "86");
    await expect(image).toHaveAttribute("height", "45");
    await expect(image.getAttribute("src")).toContain("AL-LOGO.svg");
  },
};

/** From the keyboard: the site's focus ring, 3:1 or more against the page (WCAG 1.4.11, 2.4.7). */
export const Focused: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const link = canvas.getByRole("link", { name: LOGO_ALT });
    await expect(link).toHaveFocus();
    const ring = getComputedStyle(link);
    await expect(ring.outlineStyle).toBe("solid");
    await expect(contrastOnPage(ring.outlineColor)).toBeGreaterThanOrEqual(3);
  },
};

/** On the loading screen: away, and out of the Tab order. */
export const Loading: Story = {
  beforeEach: marked("data-loading"),
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector("a")!;
    await waitFor(() => expect(link).not.toBeVisible());
  },
};

/** Under the panel's full view: away. (With the side panel it stays.) */
export const UnderFullPanel: Story = {
  beforeEach: marked("data-panel", "full"),
  play: async ({ canvasElement }) => {
    const link = canvasElement.querySelector("a")!;
    await waitFor(() => expect(link).not.toBeVisible());
  },
};
