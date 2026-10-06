import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import Gallery from "#/stories/Gallery";
import Button from "./Button";
import { BUTTON_SIZES, BUTTON_VARIANTS } from "./button.types";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: BUTTON_VARIANTS,
      description: "Visual style of the button",
      table: { defaultValue: { summary: "primary" } },
    },
    size: {
      control: "inline-radio",
      options: BUTTON_SIZES,
      description: "Padding and font size",
      table: { defaultValue: { summary: "medium" } },
    },
    state: {
      control: "inline-radio",
      options: ["default", "text", "filled"],
      description: "Interaction state — not yet implemented in component (P27-34)",
      table: { defaultValue: { summary: "default" } },
    },
  },
  args: { label: "To wander", onClick: fn() },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Any button: its label, variant and size in Controls. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "To wander" }));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** Every variant: from the filled primary to text only. */
export const Variants: Story = {
  parameters: { controls: { exclude: ["variant"] } },
  render: (args) => <Gallery values={BUTTON_VARIANTS}>{(variant) => <Button {...args} variant={variant} />}</Gallery>,
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("button")).toHaveLength(BUTTON_VARIANTS.length);
  },
};

export const Sizes: Story = {
  parameters: { controls: { exclude: ["size"] } },
  render: (args) => <Gallery values={BUTTON_SIZES}>{(size) => <Button {...args} size={size} />}</Gallery>,
};

/** A trailing icon that slides a little on hover (the navigation assistant's "→"). */
export const WithIcon: Story = {
  args: { icon: "→" },
  play: async ({ canvas }) => {
    const icon = canvas.getByRole("button").querySelector(".ui-button__icon");
    await expect(icon).toHaveAttribute("aria-hidden", "true");
  },
};
