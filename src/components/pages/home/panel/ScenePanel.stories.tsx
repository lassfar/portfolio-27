import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { usePanelStore, type PanelContent, type PanelView } from "#/stores/usePanelStore";
import ScenePanel from "./ScenePanel";

const london: PanelContent = { kind: "place", id: "london" };

/** Opens the panel on `content` in `view` for a story (and closes it after). */
const opened = (content: PanelContent, view: PanelView = "full") => () => {
  usePanelStore.setState({ content, view, photo: null, opened: true });
  return () => usePanelStore.setState({ content: null, view: "full", photo: null, opened: false });
};

const meta = {
  title: "Home/ScenePanel",
  component: ScenePanel,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#19191C" }] }, // --color-rich-black
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-rich-black">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ScenePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A place in the full view (the default): its header, its photos, the other places. */
export const FullView: Story = {
  beforeEach: opened(london),
  play: async () => {
    const page = within(document.body);
    const panel = await page.findByRole("dialog", { name: "Back to London" });
    await expect(panel).toHaveAttribute("aria-modal", "true");
    await expect(document.documentElement.dataset.panel).toBe("full");
    await expect(within(panel).getByText("United Kingdom")).toBeInTheDocument();
    await expect(within(panel).getByText("51.51° N, 0.13° W")).toBeInTheDocument();
    await expect(within(panel).getByRole("button", { name: "London" })).toHaveAttribute("aria-current", "true");
    await expect(within(panel).getAllByRole("button", { name: /^Open Placeholder — London/ })).toHaveLength(5);
  },
};

/** A place pill switches the place, after a short fade. */
export const SwitchPlace: Story = {
  beforeEach: opened(london),
  play: async () => {
    const page = within(document.body);
    const panel = await page.findByRole("dialog", { name: "Back to London" });
    await userEvent.click(within(panel).getByRole("button", { name: "New Forest" }));
    await waitFor(() => expect(page.getByRole("dialog", { name: "New Forest, Brockenhurst" })).toBeInTheDocument());
  },
};

/** The side panel: the scene stays in view beside it (a bottom sheet on a phone). */
export const SidePanel: Story = {
  beforeEach: opened(london, "side"),
  play: async () => {
    const page = within(document.body);
    const panel = await page.findByRole("dialog", { name: "Back to London" });
    await expect(panel).toHaveAttribute("aria-modal", "false");
    await expect(document.documentElement.dataset.panel).toBe("side");
    await userEvent.click(page.getByRole("button", { name: "Open the full view" }));
    await waitFor(() => expect(panel).toHaveAttribute("aria-modal", "true"));
  },
};

/** The Lab: what's on Parker's memory card. */
export const Lab: Story = {
  beforeEach: opened({ kind: "lab" }),
  play: async () => {
    const panel = await within(document.body).findByRole("dialog", { name: "On the Card" });
    await expect(within(panel).getByText("Parker Solar Probe")).toBeInTheDocument();
    await expect(within(panel).getByText("3 experiments")).toBeInTheDocument();
    await expect(within(panel).getAllByText("Drifting in soon")).toHaveLength(3);
  },
};

/** Close: the panel fades out and the story's overlays come back. */
export const Close: Story = {
  beforeEach: opened(london),
  play: async () => {
    const page = within(document.body);
    await page.findByRole("dialog", { name: "Back to London" });
    await userEvent.click(page.getByRole("button", { name: "Close" }));
    await expect(usePanelStore.getState().content).toBeNull();
    await expect(document.documentElement.dataset.panel).toBeUndefined();
  },
};
