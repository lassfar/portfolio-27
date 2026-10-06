import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { PANEL_VIEWS } from "#/stores/usePanelStore";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import PlaceChips from "#/components/pages/home/gallery/PlaceChips";
import PanelColumn from "#/stories/PanelColumn";
import { entered } from "#/stories/entered";
import { labHeader, placeHeader } from "./content";
import PanelHeader from "./PanelHeader";

const london = PHOTO_LOCATIONS.find((l) => l.id === "london")!;

const meta = {
  title: "Home/Panel/PanelHeader",
  component: PanelHeader,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story, { args }) => (
      // With the panel's entrance: its swash draws as it rises in.
      <PanelColumn view={args.view} entrance>
        <Story />
      </PanelColumn>
    ),
  ],
  argTypes: {
    view: { control: "inline-radio", options: PANEL_VIEWS },
    children: { control: false },
  },
  args: { view: "side", model: placeHeader(london), titleId: "panel-title" },
  play: async ({ canvasElement }) => entered(canvasElement),
} satisfies Meta<typeof PanelHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** At the side: the title with its key word in peach, the swash, the quote, the tags — left-aligned. */
export const Side: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent("Back to London");
    await expect(canvas.getByText("4 photos")).toBeInTheDocument();
    await entered(canvasElement);
  },
};

/** In the full view: larger, centred. */
export const Full: Story = { args: { view: "full" } };

/** With something under its tags (`children`): a place's other places. */
export const WithPlaces: Story = {
  args: { children: <PlaceChips view="side" currentId="london" onPick={fn()} /> },
};

/** A long quote (the Lab's) is set smaller. */
export const LongQuote: Story = {
  args: { model: labHeader() },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent("On the Card");
    await entered(canvasElement);
  },
};
