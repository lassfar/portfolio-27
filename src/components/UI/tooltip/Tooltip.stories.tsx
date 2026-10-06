import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties } from "react";
import { expect, userEvent, waitFor, within } from "storybook/test";

import Tooltip from "./Tooltip";

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="grid min-h-60 place-items-center p-10">
        {/* Its trigger: any positioned element marked `group/tip` (a timeline star, a panel button…). */}
        <button
          type="button"
          aria-label="Saturn"
          className="group/tip relative size-6 rounded-full bg-peach/80 focus-ring"
        >
          <Story />
        </button>
      </div>
    ),
  ],
  args: { children: "Saturn" },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Under its trigger, on hover or keyboard focus (a panel button's hint). */
export const Below: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tip = canvas.getByText("Saturn");
    await expect(tip).not.toBeVisible();
    await expect(tip).toHaveAttribute("aria-hidden", "true");
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Saturn" })).toHaveFocus();
    await waitFor(() => expect(tip).toBeVisible());
  },
};

/** Above it, after a short hover (the orb's "Next chapter"). */
export const AboveDelayed: Story = { args: { side: "above", delayed: true, children: "Next chapter" } };

/** Beside it, into the screen (a timeline star on the screen's left or right edge). */
export const Right: Story = { args: { side: "right" } };

export const Left: Story = { args: { side: "left" } };

/** Under it, flush with its end edge (a panel's top-right buttons). */
export const AlignEnd: Story = { args: { align: "end", children: "Close · Esc" } };

export const AlignStart: Story = { args: { align: "start", children: "Full view" } };

/** Shown from outside and read out as it changes (the timeline's name pill). */
export const OpenLive: Story = {
  args: { side: "right", open: true, live: true, children: "Back to London" },
  play: async ({ canvasElement }) => {
    const tip = within(canvasElement).getByText("Back to London");
    await expect(tip).toBeVisible();
    await expect(tip).toHaveAttribute("aria-live", "polite");
  },
};

/** Its text tuned by a part of the page (`--color-tooltip`), as the timeline's dev panel does. */
export const Tuned: Story = {
  args: { open: true },
  decorators: [
    (Story) => (
      <span style={{ "--color-tooltip": "var(--color-baby-blue)" } as CSSProperties}>
        <Story />
      </span>
    ),
  ],
};
