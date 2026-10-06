import type { Meta, StoryContext, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import Field from "./Field";
import type { FieldProps } from "./field.types";

const meta = {
  title: "UI/Field",
  component: Field,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      // It fills its form's column.
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
  args: { label: "Name", name: "name", placeholder: "Your name", autoComplete: "name" },
} satisfies Meta<typeof Field>;

export default meta;

// Its props are a union (an input or a textarea), which `typeof meta` can't infer stories from:
// so they're typed by the props, and their plays name their context.
type Story = StoryObj<FieldProps>;
type Context = StoryContext<FieldProps>;

/** A line to write on: its name above it, the line turns peach while focused. */
export const Default: Story = {
  play: async ({ canvas, userEvent }: Context) => {
    const input = canvas.getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "Aymane");
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue("Aymane");
  },
};

/** `multiline`: a textarea for a longer text (it doesn't resize). */
export const Multiline: Story = {
  args: { label: "Message", name: "message", multiline: true, rows: 3, placeholder: "A project, a question, or just hello." },
  play: async ({ canvas }: Context) => {
    await expect(canvas.getByRole("textbox", { name: "Message" }).tagName).toBe("TEXTAREA");
  },
};
