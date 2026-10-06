import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import { labHeader, placeHeader } from "./content";
import PanelEyebrow from "./PanelEyebrow";

const london = PHOTO_LOCATIONS.find((l) => l.id === "london")!;

const meta = {
  title: "Home/Panel/PanelEyebrow",
  component: PanelEyebrow,
  decorators: [
    (Story, { args }) => (
      <div className={args.view === "full" ? "px-6 py-10" : "w-panel-side px-8 py-10"}>
        <Story />
      </div>
    ),
  ],
  args: { view: "full", eyebrow: placeHeader(london).eyebrow },
} satisfies Meta<typeof PanelEyebrow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A place and its coordinates, between two thin peach lines (the full view). */
export const PlaceFull: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("United Kingdom")).toHaveClass("text-peach");
    await expect(canvas.getByText("51.51° N, 0.13° W")).toBeInTheDocument();
  },
};

/** At the side: at the start, a trailing line only (room kept for the panel's buttons). */
export const PlaceSide: Story = { args: { view: "side" } };

/** The Lab's longer line wraps at the side. */
export const LabSide: Story = { args: { view: "side", eyebrow: labHeader().eyebrow } };
