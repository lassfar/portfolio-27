import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRef, type ReactNode } from "react";
import { expect, within } from "storybook/test";

import type { PanelView } from "#/stores/usePanelStore";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import PlaceChips from "#/components/pages/home/gallery/PlaceChips";
import { labHeader, placeHeader } from "./content";
import PanelHeader from "./PanelHeader";
import { usePanelEntrance } from "./usePanelEntrance";

const london = PHOTO_LOCATIONS.find((l) => l.id === "london")!;

/**
 * The panel's content column — centred in the full view, the side panel's width at the side —
 * playing the panel's entrance (the swash waits for it to draw).
 */
const Column = ({ view, children }: { view: PanelView; children: ReactNode }) => {
  const ref = useRef<HTMLDivElement>(null);
  usePanelEntrance(ref, view);
  return (
    <div ref={ref} className={view === "full" ? "flex justify-center px-6 py-12" : "w-panel-side px-8 py-12"}>
      {children}
    </div>
  );
};

const meta = {
  title: "Home/Panel/PanelHeader",
  component: PanelHeader,
  decorators: [
    (Story, { args }) => (
      <Column view={args.view}>
        <Story />
      </Column>
    ),
  ],
  args: { view: "full", model: placeHeader(london), titleId: "panel-title" },
} satisfies Meta<typeof PanelHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A place in the full view: the title with its key word in peach, the swash, the quote, the tags. */
export const PlaceFull: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent("Back to London");
    await expect(canvas.getByText("4 photos")).toBeInTheDocument();
    await expect(canvas.getByText("1 clip")).toBeInTheDocument();
  },
};

/** …with the other places under it (as in the panel). */
export const WithPlaces: Story = {
  args: {
    children: <PlaceChips view="full" currentId="london" onPick={() => {}} />,
  },
};

/** At the side: smaller, left-aligned, full width. */
export const PlaceSide: Story = { args: { view: "side" } };

/** The Lab: a long quote is set smaller. */
export const Lab: Story = {
  args: { model: labHeader() },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("heading", { level: 2 })).toHaveTextContent("On the Card");
    await expect(within(canvasElement).getByText("3 experiments")).toBeInTheDocument();
  },
};

export const LabSide: Story = { args: { view: "side", model: labHeader() } };
