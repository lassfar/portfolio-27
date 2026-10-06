import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import PlaceStepper from "./PlaceStepper";

const meta = {
  title: "Home/Gallery/PlaceStepper",
  component: PlaceStepper,
  decorators: [
    (Story, { args }) => (
      <div className={args.view === "full" ? "mx-auto max-w-panel px-16 py-10" : "w-panel-side px-8 py-10"}>
        <Story />
      </div>
    ),
  ],
  args: { view: "full", currentId: "london", onPick: fn() },
} satisfies Meta<typeof PlaceStepper>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The end of a place: on to the previous or the next one (wrapping round). */
export const Full: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Previous place: Morocco" }));
    await expect(args.onPick).toHaveBeenCalledWith("morocco");
    await userEvent.click(canvas.getByRole("button", { name: "Next place: New Forest — Brockenhurst" }));
    await expect(args.onPick).toHaveBeenLastCalledWith("brockenhurst");
  },
};

/** At the side: without the "Previous" / "Next" hints. */
export const Side: Story = { args: { view: "side" } };
