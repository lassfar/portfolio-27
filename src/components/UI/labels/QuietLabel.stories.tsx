import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import Gallery from "#/stories/Gallery";
import QuietLabel from "./QuietLabel";
import { QUIET_LABEL_TONES } from "./label.types";

const meta = {
  title: "UI/QuietLabel",
  component: QuietLabel,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: { tone: { control: "inline-radio", options: QUIET_LABEL_TONES } },
  args: { children: "Parker Solar Probe" },
} satisfies Meta<typeof QuietLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A name in the scene that opens nothing. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Parker Solar Probe")).toBeVisible();
  },
};

/** `soft` for a name, `peach` for a live reading (Parker's distance). */
export const Tones: Story = {
  parameters: { controls: { exclude: ["tone"] } },
  render: (args) => (
    <Gallery values={QUIET_LABEL_TONES}>{(tone) => <QuietLabel {...args} tone={tone} />}</Gallery>
  ),
};
