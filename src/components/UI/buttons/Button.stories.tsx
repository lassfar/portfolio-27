import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import Button from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "light", "outline", "text"],
      description: "Visual style of the button",
      table: { defaultValue: { summary: "primary" } },
    },
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
      description: "Padding and font size",
      table: { defaultValue: { summary: "medium" } },
    },
    state: {
      control: { type: "select" },
      options: ["default", "text", "filled"],
      description:
        "Interaction state — not yet implemented in component (P27-34)",
      table: { defaultValue: { summary: "default" } },
    },
    label: {
      control: "text",
      description: "Button label text",
    },
    onClick: {
      action: "clicked",
      description: "Click handler",
    },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

// ── Variants ────────────────────────────────────────────────────────────────

export const Primary: Story = {
  args: {
    label: "Primary",
    variant: "primary",
    size: "medium",
    state: "filled",
  },
};

export const Secondary: Story = {
  args: { label: "Secondary", variant: "secondary", size: "medium" },
};

export const Light: Story = {
  args: { label: "Light", variant: "light", size: "medium" },
};

export const Outline: Story = {
  args: { label: "Outline", variant: "outline", size: "medium" },
};

/** With a trailing icon that slides on hover (the navigation assistant uses "→"). */
export const WithIcon: Story = {
  args: { label: "The Craft", variant: "primary", size: "medium", icon: "→" },
};

/** Text only: no border, no background. */
export const Text: Story = {
  args: { label: "Text", variant: "text", size: "medium" },
};

// ── Sizes ────────────────────────────────────────────────────────────────────

export const Small: Story = {
  args: { label: "Small", variant: "primary", size: "small" },
};

export const Large: Story = {
  args: { label: "Large", variant: "primary", size: "large" },
};
