import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { PANEL_VIEWS } from "#/stores/usePanelStore";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import PanelColumn from "#/stories/PanelColumn";
import { labHeader, placeHeader } from "./content";
import PanelEyebrow from "./PanelEyebrow";

const london = PHOTO_LOCATIONS.find((l) => l.id === "london")!;

const meta = {
  title: "Home/Panel/PanelEyebrow",
  component: PanelEyebrow,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story, { args }) => (
      <PanelColumn view={args.view}>
        <Story />
      </PanelColumn>
    ),
  ],
  argTypes: { view: { control: "inline-radio", options: PANEL_VIEWS } },
  args: { view: "side", eyebrow: placeHeader(london).eyebrow },
} satisfies Meta<typeof PanelEyebrow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** At the side: at the start, a trailing line only (room kept for the panel's buttons). */
export const Side: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("United Kingdom")).toHaveClass("text-peach");
    await expect(canvas.getByText("51.51° N, 0.13° W")).toBeInTheDocument();
  },
};

/** In the full view: centred between two thin peach lines. */
export const Full: Story = { args: { view: "full" } };

/** A long line (the Lab's) wraps at the side. */
export const LongLine: Story = { args: { eyebrow: labHeader().eyebrow } };
