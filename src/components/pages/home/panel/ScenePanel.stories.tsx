import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { usePanelStore, type PanelContent, type PanelView } from "#/stores/usePanelStore";
import SceneOverlays from "./SceneOverlays";

const london: PanelContent = { kind: "place", id: "london" };

/** Opens the panel on `content` in `view` for a story (and closes it after). */
const opened = (content: PanelContent, view: PanelView = "side", photo: number | null = null) => () => {
  usePanelStore.setState({ content, view, photo, opened: true });
  return () => usePanelStore.setState({ content: null, view: "side", photo: null, opened: false });
};

const page = () => within(document.body);

/** The panel, as the site mounts it (with its labels and the photo viewer, portalled to the body). */
const meta = {
  title: "Home/ScenePanel",
  component: SceneOverlays,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#19191C" }] }, // --color-rich-black
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-rich-black p-6">
        {/* Something of the page outside the panel. */}
        <button type="button" className="text-white/50">
          Outside
        </button>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SceneOverlays>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A place in the full view: modal — focus on Close, the page behind inert. */
export const FullView: Story = {
  beforeEach: opened(london, "full"),
  play: async () => {
    const panel = await page().findByRole("dialog", { name: "Back to London" });
    await expect(panel).toHaveAttribute("aria-modal", "true");
    await expect(document.documentElement.dataset.panel).toBe("full");
    await expect(within(panel).getByText("51.51° N, 0.13° W")).toBeInTheDocument();
    await expect(within(panel).getByRole("button", { name: "London" })).toHaveAttribute("aria-current", "true");
    await expect(within(panel).getAllByRole("button", { name: /^Open Placeholder — London/ })).toHaveLength(5);
    await waitFor(() => expect(within(panel).getByRole("button", { name: "Close" })).toHaveFocus());
    await expect(page().getByRole("button", { name: "Outside", hidden: true }).closest("[inert]")).not.toBeNull();
  },
};

/** In the full view, ← → step through the places; a place pill too. Esc closes. */
export const Keys: Story = {
  beforeEach: opened(london, "full"),
  play: async () => {
    await page().findByRole("dialog", { name: "Back to London" });
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() => expect(page().getByRole("dialog", { name: "New Forest, Brockenhurst" })).toBeInTheDocument());
    await userEvent.click(page().getByRole("button", { name: "Morocco" }));
    await waitFor(() => expect(page().getByRole("dialog", { name: "Home, Morocco" })).toBeInTheDocument());
    await userEvent.keyboard("{Escape}");
    await expect(usePanelStore.getState().content).toBeNull();
    await expect(document.documentElement.dataset.panel).toBeUndefined();
    await expect(page().getByRole("button", { name: "Outside", hidden: true }).closest("[inert]")).toBeNull();
  },
};

/** The side panel (the default): the scene stays in view and usable beside it (a bottom sheet on a phone). */
export const SidePanel: Story = {
  beforeEach: opened(london),
  play: async () => {
    const panel = await page().findByRole("dialog", { name: "Back to London" });
    await expect(panel).toHaveAttribute("aria-modal", "false");
    await expect(document.documentElement.dataset.panel).toBe("side");
    await expect(page().getByRole("button", { name: "Outside", hidden: true }).closest("[inert]")).toBeNull();
    await userEvent.click(page().getByRole("button", { name: "Open the full view" }));
    await waitFor(() => expect(panel).toHaveAttribute("aria-modal", "true"));
  },
};

/** A photo: Esc goes back to the panel (focus on its card), then closes it. */
export const Photo: Story = {
  beforeEach: opened(london, "full", 1),
  play: async () => {
    const viewer = await page().findByRole("dialog", { name: "Photo viewer" });
    await expect(within(viewer).getByText("2 / 5")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}");
    await expect(within(viewer).getByText("3 / 5")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(page().getByRole("button", { name: "Open Placeholder — London 03" })).toHaveFocus());
    await userEvent.keyboard("{Escape}");
    await expect(usePanelStore.getState().content).toBeNull();
  },
};

/** The Lab: what's on Parker's memory card. */
export const Lab: Story = {
  beforeEach: opened({ kind: "lab" }),
  play: async () => {
    const panel = await page().findByRole("dialog", { name: "On the Card" });
    await expect(within(panel).getByText("Parker Solar Probe")).toBeInTheDocument();
    await expect(within(panel).getByText("3 experiments")).toBeInTheDocument();
    await expect(within(panel).getAllByText("Drifting in soon")).toHaveLength(3);
  },
};
