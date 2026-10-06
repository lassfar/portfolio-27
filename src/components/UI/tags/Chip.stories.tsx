import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import Chip from "./Chip";

const meta = {
  title: "UI/Chip",
  component: Chip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-10">
        <Story />
      </div>
    ),
  ],
  args: { children: "London", onClick: fn() },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One of a panel's places. */
export const Place: Story = {
  play: async ({ canvasElement, args }) => {
    const chip = within(canvasElement).getByRole("button", { name: "London" });
    await expect(chip).not.toHaveAttribute("aria-current");
    await userEvent.click(chip);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** The place showing now: filled peach. */
export const Current: Story = {
  args: { current: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "London" })).toHaveAttribute(
      "aria-current",
      "true",
    );
  },
};
