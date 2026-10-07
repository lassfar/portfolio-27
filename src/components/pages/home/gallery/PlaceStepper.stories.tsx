import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { PANEL_VIEWS } from "#/stores/usePanelStore";
import PanelColumn from "#/stories/PanelColumn";
import PlaceStepper from "./PlaceStepper";

const meta = {
  title: "Home/Gallery/PlaceStepper",
  component: PlaceStepper,
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
} satisfies Meta<typeof PlaceStepper>;

export default meta;

type Story = StoryObj<typeof meta>;

/** At a place's end: on to the previous or the next one (wrapping round). */
export const Side: Story = {
  play: async ({ canvas, userEvent, args }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Previous place: Morocco" }));
    await expect(args.onPick).toHaveBeenCalledWith("morocco");
    await userEvent.click(
      canvas.getByRole("button", { name: "Next place: New Forest — Brockenhurst" }),
    );
    await expect(args.onPick).toHaveBeenLastCalledWith("brockenhurst");
  },
};

/** In the full view: with the "Previous" / "Next" hints. */
export const Full: Story = { args: { view: "full" } };
