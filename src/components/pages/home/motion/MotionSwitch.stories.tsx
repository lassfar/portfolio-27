import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { contrastOnPage } from "#/stories/contrast";
import { inCalm } from "#/stories/motion";
import { MOTION_STORAGE_KEY, storedChoice } from "#/stores/motionPreference";
import { useMotion } from "#/stores/useMotion";
import ModeVeil from "./ModeVeil";
import MotionSwitch from "./MotionSwitch";
import { PAGE_CONTROLS_ID } from "./pageControls";

const page = () => within(document.body);
const theSwitch = () => page().findByRole("button", { name: "Reduce motion" });

/** The switch, as the site mounts it: fixed to the top-right corner, portalled to the body. */
const meta = {
  title: "Home/MotionSwitch",
  component: MotionSwitch,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "10rem" } },
  },
  // Never leave a choice saved, nor the page calm, for the next story.
  beforeEach: () => () => {
    localStorage.removeItem(MOTION_STORAGE_KEY);
    useMotion.setState({ choice: null });
  },
} satisfies Meta<typeof MotionSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Full motion (as the device asks): not pressed. Its tooltip starts with its name, so it can be called by what it shows (WCAG 2.5.3). A click turns calm on, for the whole page, and it's remembered. */
export const Default: Story = {
  play: async ({ userEvent }) => {
    const button = await theSwitch();
    await expect(button).toHaveAttribute("aria-pressed", "false");
    await expect(page().getByText("Reduce motion · off")).toBeInTheDocument();
    await userEvent.click(button);
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(document.documentElement.dataset.motion).toBe("calm");
    await expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe(
      storedChoice("calm", useMotion.getState().device),
    );
  },
};

/** Calm: pressed, peach. From the keyboard too: Tab to it, Space turns full motion back on. */
export const Calm: Story = {
  beforeEach: inCalm,
  play: async ({ userEvent }) => {
    const button = await theSwitch();
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page().getByText("Reduce motion · on")).toBeInTheDocument();
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(button).toHaveAttribute("aria-pressed", "false");
  },
};

/** While a panel is open: it steps away, out of reach (the panel's controls take the corner). */
export const Hidden: Story = {
  beforeEach: () => {
    document.documentElement.dataset.panel = "side";
    return () => {
      delete document.documentElement.dataset.panel;
    };
  },
  play: async () => {
    // Hidden, it has no accessible name to find it by: by its label's attribute, then.
    const button = await waitFor(() => {
      const found = document.querySelector<HTMLElement>('[aria-label="Reduce motion"]');
      if (!found) throw new Error("No switch yet");
      return found;
    });
    await waitFor(() => expect(button).not.toBeVisible());
  },
};

/** As the page places it: first in the page (the layout's page controls), so it's the first Tab stop, before anything of the story (WCAG 2.4.3: the way to stop the motion comes first). */
export const FirstTabStop: Story = {
  decorators: [
    (Story) => (
      <>
        <button type="button" className="m-6 text-white/80">
          Something of the page
        </button>
        <Story />
      </>
    ),
  ],
  beforeEach: () => {
    const controls = document.createElement("div");
    controls.id = PAGE_CONTROLS_ID;
    controls.dataset.modeKeep = "";
    document.body.prepend(controls);
    return () => controls.remove();
  },
  play: async ({ userEvent }) => {
    const button = await theSwitch();
    await expect(button.closest(`#${PAGE_CONTROLS_ID}`)).not.toBeNull();
    await userEvent.tab();
    await expect(button).toHaveFocus();
  },
};

/** Focused from the keyboard: the site's focus ring, 3:1 or more against the page (WCAG 1.4.11, 2.4.7). */
export const Focused: Story = {
  play: async ({ userEvent }) => {
    const button = await theSwitch();
    await userEvent.tab();
    await expect(button).toHaveFocus();
    const ring = getComputedStyle(button);
    await expect(ring.outlineStyle).toBe("solid");
    await expect(contrastOnPage(ring.outlineColor)).toBeGreaterThanOrEqual(3);
  },
};

/** While the modes switch: above the transition screen, so the focus is never hidden behind it (WCAG 2.4.11), and it can be pressed again. */
export const Switching: Story = {
  render: () => (
    <>
      <ModeVeil shown to="calm" place="earth" />
      <MotionSwitch />
    </>
  ),
  beforeEach: () => {
    document.documentElement.setAttribute("data-mode-switching", "");
    return () => document.documentElement.removeAttribute("data-mode-switching");
  },
  play: async ({ userEvent }) => {
    const button = await theSwitch();
    await userEvent.tab();
    await expect(button).toHaveFocus();
    const r = button.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    await expect(button.contains(hit)).toBe(true);
  },
};
