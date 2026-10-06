import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { usePanelStore } from "#/stores/usePanelStore";
import Lightbox from "./Lightbox";

const meta = {
  title: "Home/Gallery/Lightbox",
  component: Lightbox,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "36rem" } },
  },
  beforeEach: () => {
    usePanelStore.setState({ content: { kind: "place", id: "london" }, view: "full", photo: 1, opened: true });
    return () => usePanelStore.setState({ content: null, view: "side", photo: null, opened: false });
  },
} satisfies Meta<typeof Lightbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Open on a photo (London's second): step through them, then go back to the panel. */
export const Default: Story = {
  play: async ({ userEvent }) => {
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
