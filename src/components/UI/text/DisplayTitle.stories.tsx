import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import Gallery from "#/stories/Gallery";
import DisplayTitle from "./DisplayTitle";
import { DISPLAY_TITLE_SIZES } from "./text.types";

const meta = {
  title: "UI/DisplayTitle",
  component: DisplayTitle,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-10">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    size: { control: "select", options: DISPLAY_TITLE_SIZES },
    as: { control: "inline-radio", options: ["h1", "h2", "h3"] },
  },
  args: { text: "Small, Patient *Details*", size: "xl" },
} satisfies Meta<typeof DisplayTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Any title: write it in Controls, its key words between asterisks. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const title = canvas.getByRole("heading", { level: 2 });
    await expect(title).toHaveTextContent("Small, Patient Details");
    await expect(within(title).getByText("Details")).toHaveClass("text-peach");
  },
};

/** Every size, largest to smallest: the hero's headline, the sections' titles, a panel's. */
export const Sizes: Story = {
  parameters: { controls: { exclude: ["size"] } },
  render: (args) => (
    <Gallery values={DISPLAY_TITLE_SIZES} layout="stack">
      {(size) => <DisplayTitle {...args} size={size} />}
    </Gallery>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("heading")).toHaveLength(DISPLAY_TITLE_SIZES.length);
  },
};
