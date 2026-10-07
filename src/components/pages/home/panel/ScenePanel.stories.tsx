import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { usePanelStore, type PanelContent, type PanelView } from "#/stores/usePanelStore";
import { entered } from "#/stories/entered";
import { inCalm } from "#/stories/motion";
import SceneOverlays from "./SceneOverlays";

const london: PanelContent = { kind: "place", id: "london" };

/** Opens the panel on `content` in `view` for a story (and closes it after). */
const opened =
  (content: PanelContent, view: PanelView = "side", photo: number | null = null) =>
  () => {
    usePanelStore.setState({ content, view, photo, opened: true });
    return () =>
      usePanelStore.setState({ content: null, view: "side", photo: null, opened: false });
  };

const page = () => within(document.body);

/** The panel, as the site mounts it (with its labels and the photo viewer, portalled to the body). */
const meta = {
  title: "Home/Panel/ScenePanel",
  component: SceneOverlays,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "36rem" } },
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen p-6">
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

/** At the side (the default): the scene stays in view and usable beside it (a bottom sheet on a phone). */
export const Side: Story = {
  beforeEach: opened(london),
  play: async ({ userEvent }) => {
    const panel = await page().findByRole("dialog", { name: "Back to London" });
    await expect(panel).toHaveAttribute("aria-modal", "false");
    await expect(document.documentElement.dataset.panel).toBe("side");
    await expect(
      page().getByRole("button", { name: "Outside", hidden: true }).closest("[inert]"),
    ).toBeNull();
    await userEvent.click(page().getByRole("button", { name: "Open the full view" }));
    await waitFor(() => expect(panel).toHaveAttribute("aria-modal", "true"));
    await entered(panel);
  },
};

/** In calm motion: it only fades in and out, shorter (no slide), and its content fades in at once. */
export const Calm: Story = {
  beforeEach: [inCalm, opened(london)],
  play: async () => {
    const panel = await page().findByRole("dialog", { name: "Back to London" });
    await expect(getComputedStyle(panel).transitionProperty).toBe("opacity");
    await expect(getComputedStyle(panel).translate).toBe("none");
    await entered(panel);
  },
};

/** In the full view: modal — focus on Close, the page behind inert. */
export const Full: Story = {
  beforeEach: opened(london, "full"),
  play: async () => {
    const panel = await page().findByRole("dialog", { name: "Back to London" });
    await expect(panel).toHaveAttribute("aria-modal", "true");
    await expect(document.documentElement.dataset.panel).toBe("full");
    await expect(within(panel).getByText("51.51° N, 0.13° W")).toBeInTheDocument();
    await expect(within(panel).getByRole("button", { name: "London" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    await expect(
      within(panel).getAllByRole("button", { name: /^Open Placeholder — London/ }),
    ).toHaveLength(5);
    await waitFor(() => expect(within(panel).getByRole("button", { name: "Close" })).toHaveFocus());
    await expect(
      page().getByRole("button", { name: "Outside", hidden: true }).closest("[inert]"),
    ).not.toBeNull();
    await entered(panel);
  },
};

/** In the full view, ← → step through the places; a place pill too. Esc closes. */
export const Keys: Story = {
  beforeEach: opened(london, "full"),
  play: async ({ userEvent }) => {
    await page().findByRole("dialog", { name: "Back to London" });
    await userEvent.keyboard("{ArrowRight}");
    await waitFor(() =>
      expect(page().getByRole("dialog", { name: "New Forest, Brockenhurst" })).toBeInTheDocument(),
    );
    await userEvent.click(page().getByRole("button", { name: "Morocco" }));
    await waitFor(() =>
      expect(page().getByRole("dialog", { name: "Home, Morocco" })).toBeInTheDocument(),
    );
    await userEvent.keyboard("{Escape}");
    await expect(usePanelStore.getState().content).toBeNull();
    await expect(document.documentElement.dataset.panel).toBeUndefined();
    await expect(
      page().getByRole("button", { name: "Outside", hidden: true }).closest("[inert]"),
    ).toBeNull();
  },
};

/** A photo open over it: Esc goes back to the panel (focus on its card), then closes it. */
export const Photo: Story = {
  beforeEach: opened(london, "full", 1),
  play: async ({ userEvent }) => {
    const viewer = await page().findByRole("dialog", { name: "Photo viewer" });
    await expect(within(viewer).getByText("2 / 5")).toBeInTheDocument();
    await userEvent.keyboard("{ArrowRight}");
    await expect(within(viewer).getByText("3 / 5")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await waitFor(() =>
      expect(page().getByRole("button", { name: "Open Placeholder — London 03" })).toHaveFocus(),
    );
    await userEvent.keyboard("{Escape}");
    await expect(usePanelStore.getState().content).toBeNull();
  },
};

/** The Lab's content: what's on Parker's memory card. */
export const Lab: Story = {
  beforeEach: opened({ kind: "lab" }),
  play: async () => {
    const panel = await page().findByRole("dialog", { name: "On the Card" });
    await expect(within(panel).getByText("Parker Solar Probe")).toBeInTheDocument();
    await expect(within(panel).getByText("3 experiments")).toBeInTheDocument();
    await expect(within(panel).getAllByText("Drifting in soon")).toHaveLength(3);
    await entered(panel);
  },
};
