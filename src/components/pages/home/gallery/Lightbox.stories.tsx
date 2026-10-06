import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { usePanelStore } from "#/stores/usePanelStore";
import Lightbox from "./Lightbox";

const meta = {
  title: "Home/Lightbox",
  component: Lightbox,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#19191C" }] }, // --color-rich-black
  },
  beforeEach: () => {
    usePanelStore.setState({ content: { kind: "place", id: "london" }, view: "full", photo: 1, opened: true });
    return () => usePanelStore.setState({ content: null, view: "side", photo: null, opened: false });
  },
} satisfies Meta<typeof Lightbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/** London's second photo: step through them, then go back to the panel. */
export const Photo: Story = {
  play: async () => {
    const viewer = within(await within(document.body).findByRole("dialog", { name: "Photo viewer" }));
    await expect(viewer.getByText("2 / 5")).toBeInTheDocument();
    await userEvent.click(viewer.getByRole("button", { name: "Next photo" }));
    await expect(viewer.getByText("3 / 5")).toBeInTheDocument();
    await userEvent.click(viewer.getByRole("button", { name: "Previous photo" }));
    await userEvent.click(viewer.getByRole("button", { name: "Previous photo" }));
    await expect(viewer.getByText("1 / 5")).toBeInTheDocument();
    await userEvent.click(viewer.getByRole("button", { name: "Close the photo" }));
    await waitFor(() => expect(usePanelStore.getState().photo).toBeNull());
    await expect(usePanelStore.getState().content).not.toBeNull(); // back to the panel
  },
};
