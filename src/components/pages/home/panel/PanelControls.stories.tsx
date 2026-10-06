import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";

import { usePanelStore } from "#/stores/usePanelStore";
import PanelControls from "./PanelControls";

const meta = {
  title: "Home/Panel/PanelControls",
  component: PanelControls,
  decorators: [
    (Story) => (
      // A panel's top corner (they're placed absolutely, top right).
      <div className="relative h-40 w-panel-side bg-rich-black/76 inset-ring inset-ring-white/10">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    usePanelStore.setState({ content: { kind: "place", id: "london" }, view: "side", photo: null, opened: true });
    return () => usePanelStore.setState({ content: null, view: "side", photo: null, opened: false });
  },
  args: { view: "side" },
} satisfies Meta<typeof PanelControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** At the side: open the full view, or close (hover them for their tooltips). */
export const Side: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Open the full view" }));
    await expect(usePanelStore.getState().view).toBe("full");
    await userEvent.click(canvas.getByRole("button", { name: "Close" }));
    await expect(usePanelStore.getState().content).toBeNull();
  },
};

/** In the full view: back to the side panel. */
export const Full: Story = {
  args: { view: "full" },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("button", { name: "Show as a side panel" })).toBeInTheDocument();
    await expect(within(canvasElement).getByRole("button", { name: "Close" })).toHaveAttribute(
      "aria-keyshortcuts",
      "Escape",
    );
  },
};
