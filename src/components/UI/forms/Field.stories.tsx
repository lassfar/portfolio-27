import type { Meta, StoryContext, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import Field from "./Field";
import type { FieldProps } from "./field.types";

const meta = {
  title: "UI/Field",
  component: Field,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-md p-10">
        <Story />
      </div>
    ),
  ],
  args: { label: "Name", name: "name", placeholder: "Your name", autoComplete: "name" },
} satisfies Meta<typeof Field>;

export default meta;

// Its props are a union (an input or a textarea), which `typeof meta` can't infer from; so its plays name their context's type.
type Story = StoryObj<FieldProps>;

/** Its name over the line it's written on; the line turns peach while focused. */
export const Text: Story = {
  play: async ({ canvasElement }: StoryContext<FieldProps>) => {
    const input = within(canvasElement).getByRole("textbox", { name: "Name" });
    await userEvent.type(input, "Aymane");
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue("Aymane");
  },
};

export const Email: Story = {
  args: { label: "Email", name: "email", type: "email", placeholder: "you@somewhere.com", autoComplete: "email" },
};

/** A longer text: a textarea (it doesn't resize). */
export const Multiline: Story = {
  args: {
    label: "Message",
    name: "message",
    multiline: true,
    rows: 3,
    placeholder: "A project, a question, or just hello.",
  },
  play: async ({ canvasElement }: StoryContext<FieldProps>) => {
    const textarea = within(canvasElement).getByRole("textbox", { name: "Message" });
    await expect(textarea.tagName).toBe("TEXTAREA");
  },
};
