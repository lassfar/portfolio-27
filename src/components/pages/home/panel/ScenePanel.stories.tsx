import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { useEffect, useState } from "react";
import { inertExcept } from "#/components/hooks/a11y/inertExcept";
import { usePanelStore, type PanelContent, type PanelView } from "#/stores/usePanelStore";
import { contrastOnFill } from "#/stories/contrast";
import { entered } from "#/stories/entered";
import { inCalm } from "#/stories/motion";
import { PANEL_ID } from "./config";
import PanelHost from "./PanelHost";
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

/** A pointer pulling the sheet's grip down by `dy` px, then letting go. */
const pull = async (panel: HTMLElement, dy: number) => {
  const grip = panel.querySelector<HTMLElement>(".touch-none")!;
  const { left, top } = grip.getBoundingClientRect();
  const at = (type: string, y: number) =>
    grip.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        pointerId: 7,
        pointerType: "touch",
        clientX: left + 40,
        clientY: y,
      }),
    );
  at("pointerdown", top + 10);
  for (let y = 12; y <= dy; y += 12) {
    at("pointermove", top + 10 + y);
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
  at("pointerup", top + 10 + dy);
};

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
    // Around it is the scene, still usable: no scrim to tap (that's the calm book's).
    await expect(document.querySelector("[data-panel-scrim]")).toBeNull();
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
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: async () => {
    const panel = await page().findByRole("dialog", { name: "Back to London" });
    await expect(getComputedStyle(panel).transitionProperty).toBe("opacity");
    await expect(getComputedStyle(panel).translate).toBe("none");
    await entered(panel);
    // A phone's sheet, pulled a little: it follows the finger only, back at once (no slide).
    await pull(panel, 48);
    await expect(panel.style.translate).toBe("");
    await expect(getComputedStyle(panel).transitionProperty).toBe("opacity");
  },
};

/** On a phone, the sheet swiped down: it follows the finger; a short pull goes back, a longer one (or a flick) closes it. Close and Escape still do (WCAG 2.5.1, 2.5.7). */
export const Swipe: Story = {
  beforeEach: opened(london),
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: async () => {
    const panel = await page().findByRole("dialog", { name: "Back to London" });
    await entered(panel);
    await pull(panel, 48);
    await waitFor(() => expect(panel.style.translate).toBe(""));
    await expect(usePanelStore.getState().content).not.toBeNull();
    await pull(panel, 240);
    await waitFor(() => expect(usePanelStore.getState().content).toBeNull());
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

/** In the calm book (`PanelHost modal`): modal in both views, the page behind inert. A tap on the dimmed page (its scrim) closes it. Its full view frosts the page itself (no scene is veiled behind it), its words readable over whatever the book shows (WCAG 1.4.3, at worst over white). */
export const Modal: Story = {
  render: () => <PanelHost modal />,
  beforeEach: [inCalm, opened(london)],
  play: async () => {
    const panel = await page().findByRole("dialog", { name: "Back to London" });
    await expect(panel).toHaveAttribute("aria-modal", "true");
    await entered(panel);
    const scrim = document.querySelector<HTMLElement>("[data-panel-scrim]")!;
    await expect(scrim.inert).toBe(false);
    scrim.click();
    await waitFor(() => expect(usePanelStore.getState().content).toBeNull());

    usePanelStore.setState({ content: london, view: "full" });
    const full = await page().findByRole("dialog", { name: "Back to London" });
    const fill = getComputedStyle(full);
    await expect(fill.backdropFilter).toMatch(/blur/);
    await expect(contrastOnFill("#ffa14a", fill.backgroundColor)).toBeGreaterThanOrEqual(4.5);
    await expect(
      contrastOnFill("rgb(255 255 255 / 0.55)", fill.backgroundColor),
    ).toBeGreaterThanOrEqual(4.5);
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

/** Mounts its panel host when the story asks (the event below), like a tree the mode switch mounts. */
const MountsLater = () => {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const show = () => setShown(true);
    window.addEventListener("mount-panel", show);
    return () => window.removeEventListener("mount-panel", show);
  }, []);
  return shown ? <PanelHost /> : null;
};

/** Closed: hidden and inert, so nothing in it can be reached. It stays so when it arrives under the mode switch's screen (the page made inert, then given back): the panel's own inert is never touched (P27-95). */
export const Closed: Story = {
  render: () => <MountsLater />,
  play: async () => {
    const release = inertExcept((el) => el.hasAttribute("data-mode-keep"));
    window.dispatchEvent(new Event("mount-panel"));
    const panel = await waitFor(() => {
      const found = document.getElementById(PANEL_ID);
      if (!found) throw new Error("Not mounted yet");
      return found;
    });
    await waitFor(() => expect(panel.inert).toBe(true));
    release();
    await expect(panel.inert).toBe(true);
    await expect(panel.closest("[data-panel-layer]")).not.toBeNull();
    await expect(getComputedStyle(panel).visibility).toBe("hidden");
  },
};
