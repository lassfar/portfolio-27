import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import AccentText from "./AccentText";

const meta = {
  title: "UI/AccentText",
  component: AccentText,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-10">
        <Story />
      </div>
    ),
  ],
  args: { text: "Back to *London*" },
  // As a title (Great Vibes, white): what the panels and the sections do.
  render: (args) => (
    <h2 className="font-great-vibes text-display-sm font-normal text-white">
      <AccentText {...args} />
    </h2>
  ),
} satisfies Meta<typeof AccentText>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A title with its key word in peach (written between asterisks). */
export const Title: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("London")).toHaveClass("text-peach");
    await expect(within(canvasElement).getByRole("heading")).toHaveTextContent("Back to London");
  },
};

/** The accent first. */
export const AccentFirst: Story = { args: { text: "*Home*, Morocco" } };

/** In a subtitle: several accents, styled by `accentClassName`. */
export const Subtitle: Story = {
  args: {
    text: "Before it has to *come apart*. *Dot by dot* — I've",
    accentClassName: "text-peach",
  },
  render: (args) => (
    <p className="max-w-md text-base font-light leading-relaxed text-white/90">
      <AccentText {...args} />
    </p>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll(".text-peach")).toHaveLength(2);
  },
};
