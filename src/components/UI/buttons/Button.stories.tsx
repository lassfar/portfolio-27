import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import Button from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  parameters: {
    // Render on the portfolio background so secondary/light variants look realistic
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#19191C" }, // --color-rich-black
        { name: "light", value: "#ffffff" },
      ],
    },
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["primary", "secondary", "light", "outline"],
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
      description: "Interaction state — not yet implemented in component (P27-34)",
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
  args: { label: "Primary", variant: "primary", size: "medium" },
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

// ── Sizes ────────────────────────────────────────────────────────────────────

export const Small: Story = {
  args: { label: "Small", variant: "primary", size: "small" },
};

export const Large: Story = {
  args: { label: "Large", variant: "primary", size: "large" },
};
