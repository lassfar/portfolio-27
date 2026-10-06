import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import QuietLabel from "./QuietLabel";

const meta = {
  title: "UI/QuietLabel",
  component: QuietLabel,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex justify-center p-10">
        <Story />
      </div>
    ),
  ],
  args: { children: "Parker Solar Probe" },
} satisfies Meta<typeof QuietLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A name in the scene that opens nothing (the probe seen from afar). */
export const Soft: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("Parker Solar Probe")).toBeVisible();
  },
};

/** A live reading by its point (Parker's distance), its digits tabular so it doesn't jitter. */
export const Peach: Story = { args: { tone: "peach", className: "tabular-nums", children: "6.9 million km" } };

/** A journey label: short, and its full line on hover (its own states, through `className`). */
export const JourneyLabel: Story = {
  args: {
    className: "group hover:text-peach",
    children: (
      <>
        <span className="group-hover:hidden">Venus 1 · 2</span>
        <span className="hidden group-hover:inline">Venus flybys · loops now reach 14.2 million km</span>
      </>
    ),
  },
};
