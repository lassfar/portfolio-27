import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { inCalm } from "#/stories/motion";
import { MOTION_STORAGE_KEY, storedChoice } from "#/stores/motionPreference";
import { useMotion } from "#/stores/useMotion";
import MotionSwitch from "./MotionSwitch";

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
