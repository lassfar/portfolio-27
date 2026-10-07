import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { PANEL_VIEWS, usePanelStore } from "#/stores/usePanelStore";
import PanelControls from "./PanelControls";

const meta = {
  title: "Home/Panel/PanelControls",
  component: PanelControls,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      // A panel's top corner (they're placed absolutely, top right).
      <div className="relative h-40 w-panel-side bg-rich-black/76 inset-ring inset-ring-white/10">
        <Story />
      </div>
    ),
  ],
  beforeEach: () => {
    usePanelStore.setState({
      content: { kind: "place", id: "london" },
      view: "side",
      photo: null,
      opened: true,
    });
    return () =>
      usePanelStore.setState({ content: null, view: "side", photo: null, opened: false });
  },
  argTypes: { view: { control: "inline-radio", options: PANEL_VIEWS } },
  args: { view: "side" },
} satisfies Meta<typeof PanelControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** At the side: open the full view, or close (hover them for their tooltips). */
export const Side: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Open the full view" }));
    await expect(usePanelStore.getState().view).toBe("full");
    await userEvent.click(canvas.getByRole("button", { name: "Close" }));
    await expect(usePanelStore.getState().content).toBeNull();
  },
};

/** In the full view: back to the side panel. */
export const Full: Story = {
  args: { view: "full" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Show as a side panel" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Close" })).toHaveAttribute(
      "aria-keyshortcuts",
      "Escape",
    );
  },
};
