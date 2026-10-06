import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import Chip from "./Chip";

const meta = {
  title: "UI/Chip",
  component: Chip,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { children: "London", onClick: fn() },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A choice among others (a panel's places): a glass pill. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const chip = canvas.getByRole("button", { name: "London" });
    await expect(chip).not.toHaveAttribute("aria-current");
    await userEvent.click(chip);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** The current one: filled peach. */
export const Current: Story = {
  args: { current: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "London" })).toHaveAttribute("aria-current", "true");
  },
};
