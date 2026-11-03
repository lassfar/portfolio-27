import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";
import { expect, waitFor } from "storybook/test";

import { LOADER } from "#/components/pages/home/story/copy";
import PageLoader from "./PageLoader";

/** <html> marked as the head script marks it in full motion: the screen shows. */
const whileLoading = () => {
  document.documentElement.setAttribute("data-loading", "");
  return () => document.documentElement.removeAttribute("data-loading");
};

/** The loading screen, at a given point of the load (`load`, 0–1: as useLoadProgress sets it). */
const meta = {
  title: "Home/PageLoader",
  component: PageLoader,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "24rem" } },
  },
  args: { load: 0.3 },
  argTypes: {
    load: { control: { type: "range", min: 0, max: 1, step: 0.05 }, description: "The progress" },
  },
  beforeEach: whileLoading,
  render: ({ load }) => (
    <div style={{ "--load": load } as CSSProperties}>
      <PageLoader />
    </div>
  ),
} satisfies Meta<{ load: number }>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Sketching: the pencil draws the planet and its ring (up to 55%); under it the line in Aymane's voice, the percentage and the hint at how the journey works, the camera's settings in the viewfinder. A progress bar, named for screen readers. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const bar = canvas.getByRole("progressbar", { name: LOADER.label });
    await expect(bar).toBeVisible();
    for (const words of [LOADER.line, LOADER.hint, LOADER.camera]) {
      await expect(canvas.getByText(words)).toBeVisible();
    }
  },
};

/** Inked: past 55% the peach ink fills the planet and draws its ring. */
export const Inked: Story = {
  args: { load: 1 },
  play: async ({ canvasElement }) => {
    const ink = canvasElement.querySelector<SVGCircleElement>(".page-loader__ink")!;
    await waitFor(() => expect(Number(getComputedStyle(ink).opacity)).toBe(1));
  },
};

/** Lifted (the journey drawn, or a calm visit): it fades out, out of reach of screen readers. */
export const Lifted: Story = {
  // After the meta's: <html> no longer marked.
  beforeEach: () => document.documentElement.removeAttribute("data-loading"),
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector<HTMLElement>("[data-page-loader]")!;
    await waitFor(() => expect(bar).not.toBeVisible());
  },
};
