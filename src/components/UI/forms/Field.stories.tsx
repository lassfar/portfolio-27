import type { Meta, StoryContext, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { contrastOnPage } from "#/stories/contrast";

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

/** A line to write on: its name above it, the line turns peach while focused. The line stands out at 3:1 (WCAG 1.4.11), its hint reads at 4.5:1 (1.4.3). */
export const Default: Story = {
  play: async ({ canvas, userEvent }: Context) => {
    const input = canvas.getByRole("textbox", { name: "Name" });
    await expect(contrastOnPage(getComputedStyle(input).borderBottomColor)).toBeGreaterThanOrEqual(
      3,
    );
    await expect(
      contrastOnPage(getComputedStyle(input, "::placeholder").color),
    ).toBeGreaterThanOrEqual(4.5);
    await userEvent.type(input, "Aymane");
    await expect(input).toHaveFocus();
    await expect(input).toHaveValue("Aymane");
  },
};

/** `multiline`: a textarea for a longer text (it doesn't resize). */
export const Multiline: Story = {
  args: {
    label: "Message",
    name: "message",
    multiline: true,
    rows: 3,
    placeholder: "A project, a question, or just hello.",
  },
  play: async ({ canvas }: Context) => {
    await expect(canvas.getByRole("textbox", { name: "Message" }).tagName).toBe("TEXTAREA");
  },
};

/** `error`: what's wrong with its value, under a thicker dark-peach line, and read with the field (WCAG 3.3.1). The text reads at 4.5:1, the line stands out at 3:1. */
export const Invalid: Story = {
  args: {
    label: "Email",
    name: "email",
    type: "email",
    defaultValue: "ada@",
    error: "That doesn’t look like an email address.",
  },
  argTypes: { error: { control: "text" } },
  play: async ({ canvas }: Context) => {
    const input = canvas.getByRole("textbox", { name: "Email" });
    await expect(input).toBeInvalid();
    await expect(input).toHaveAccessibleDescription("That doesn’t look like an email address.");
    const error = canvas.getByText("That doesn’t look like an email address.");
    await expect(contrastOnPage(getComputedStyle(error).color)).toBeGreaterThanOrEqual(4.5);
    await expect(contrastOnPage(getComputedStyle(input).borderBottomColor)).toBeGreaterThanOrEqual(
      3,
    );
    // Faded in, so the a11y check that follows measures its colour.
    await waitFor(() => expect(error.parentElement).toHaveStyle({ opacity: "1" }));
  },
};
