import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import AccentText from "./AccentText";

const meta = {
  title: "UI/AccentText",
  component: AccentText,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { text: "Before it has to *come apart*. *Dot by dot* — I've" },
  // Inline: it takes its element's look (here a line of text); DisplayTitle sets it as a title.
  render: (args) => (
    <p className="text-lg font-light text-white/90">
      <AccentText {...args} />
    </p>
  ),
} satisfies Meta<typeof AccentText>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Its words between asterisks in peach (or `accentClassName`): write any text in Controls. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("come apart")).toHaveClass("text-peach");
    await expect(canvas.getByText("Dot by dot")).toHaveClass("text-peach");
  },
};
