import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import DisplayTitle from "./DisplayTitle";

const meta = {
  title: "UI/DisplayTitle",
  component: DisplayTitle,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-10 text-center">
        <Story />
      </div>
    ),
  ],
  args: { size: "xl", text: "Small, Patient *Details*" },
} satisfies Meta<typeof DisplayTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Maker: its key word in peach. */
export const Maker: Story = {
  play: async ({ canvasElement }) => {
    const title = within(canvasElement).getByRole("heading", { level: 2 });
    await expect(title).toHaveTextContent("Small, Patient Details");
    await expect(within(title).getByText("Details")).toHaveClass("text-peach");
  },
};

/** The hero's headline: the page's h1, a longer line. */
export const Hero: Story = {
  args: { as: "h1", size: "hero", text: "A quiet maker of *Small Universes*" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("heading", { level: 1 })).toBeVisible();
  },
};

export const Contact: Story = { args: { size: "lg", text: "Say *Hello*" } };

export const Craft: Story = { args: { size: "md", text: "What I’m *drawn to*" } };

/** All in peach: the thank-you, under Contact's title. */
export const ThankYou: Story = { args: { as: "h3", size: "sm", text: "*Thank you*" } };

/** A panel's title in the full view… */
export const Panel: Story = { args: { size: "panel", text: "Back to *London*" } };

/** …and at the side. */
export const PanelSide: Story = { args: { size: "panel-side", text: "Back to *London*" } };
