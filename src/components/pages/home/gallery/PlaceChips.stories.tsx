import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import PlaceChips from "./PlaceChips";

const meta = {
  title: "Home/Gallery/PlaceChips",
  component: PlaceChips,
  decorators: [
    (Story, { args }) => (
      <div className={args.view === "full" ? "flex justify-center p-10" : "w-panel-side px-8 py-10"}>
        <Story />
      </div>
    ),
  ],
  args: { view: "full", currentId: "london", onPick: fn() },
} satisfies Meta<typeof PlaceChips>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The places, the one showing filled peach; another opens there. Long names use their short form. */
export const Full: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "London" })).toHaveAttribute("aria-current", "true");
    await userEvent.click(canvas.getByRole("button", { name: "New Forest" }));
    await expect(args.onPick).toHaveBeenCalledWith("brockenhurst");
  },
};

/** At the side: "Places" above the pills. */
export const Side: Story = { args: { view: "side", currentId: "morocco" } };
