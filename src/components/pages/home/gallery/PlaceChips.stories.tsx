import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { PANEL_VIEWS } from "#/stores/usePanelStore";
import PanelColumn from "#/stories/PanelColumn";
import PlaceChips from "./PlaceChips";

const meta = {
  title: "Home/Gallery/PlaceChips",
  component: PlaceChips,
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
  args: { view: "side", currentId: "london", onPick: fn() },
} satisfies Meta<typeof PlaceChips>;

export default meta;

type Story = StoryObj<typeof meta>;

/** At the side: "Places" above the pills, the one showing filled peach; another opens there. */
export const Side: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole("button", { name: "London" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await userEvent.click(canvas.getByRole("button", { name: "New Forest" }));
    await expect(args.onPick).toHaveBeenCalledWith("brockenhurst");
  },
};

/** In the full view: in one centred row. */
export const Full: Story = { args: { view: "full" } };
