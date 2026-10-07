import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import Gallery from "#/stories/Gallery";
import { ICON_ARG_TYPE, SITE_ICONS } from "#/stories/icons";
import Button from "./Button";
import { BUTTON_ICON_SLIDES, BUTTON_SIZES, BUTTON_VARIANTS } from "./button.types";

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
    icon: ICON_ARG_TYPE,
    iconSlide: { control: "inline-radio", options: BUTTON_ICON_SLIDES },
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
  render: (args) => (
    <Gallery values={BUTTON_VARIANTS}>
      {(variant) => <Button {...args} variant={variant} />}
    </Gallery>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("button")).toHaveLength(BUTTON_VARIANTS.length);
  },
};

export const Sizes: Story = {
  parameters: { controls: { exclude: ["size"] } },
  render: (args) => (
    <Gallery values={BUTTON_SIZES}>{(size) => <Button {...args} size={size} />}</Gallery>
  ),
};

/** A trailing icon that slides a little on hover, the way it points (the next-chapter button's arrow down). */
export const WithIcon: Story = {
  args: { label: "The Lab", icon: SITE_ICONS.ArrowDown, iconSlide: "down" },
  play: async ({ canvas }) => {
    const icon = canvas
      .getByRole("button", { name: "The Lab" })
      .querySelector("[data-button-icon]");
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    await expect(icon?.querySelector("svg")).not.toBeNull();
  },
};

/** Disabled (e.g. "Sending…"): faded, no glow, not clickable. */
export const Disabled: Story = {
  args: { label: "Sending…", disabled: true },
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: "Sending…" });
    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
