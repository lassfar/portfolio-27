import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CSSProperties, ReactNode } from "react";
import { expect, fn, waitFor } from "storybook/test";

import Gallery from "#/stories/Gallery";
import { inCalm } from "#/stories/motion";
import Tooltip from "./Tooltip";
import { TOOLTIP_ALIGNS, TOOLTIP_SIDES } from "./tooltip.types";

/** Its trigger: any positioned element marked `group/tip` (a timeline star, a panel button…). */
const Trigger = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Saturn"
    className="group/tip relative size-6 rounded-full bg-peach/80 focus-ring"
  >
    {children}
  </button>
);

/** The trigger's press (the Hoverable story): a click on the tooltip mustn't reach it. */
const pressed = fn();

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      // Room on every side for it to open into.
      <div className="flex min-h-60 items-center justify-center p-16">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    side: { control: "inline-radio", options: TOOLTIP_SIDES },
    align: { control: "inline-radio", options: TOOLTIP_ALIGNS },
  },
  args: { children: "Saturn" },
  render: (args) => (
    <Trigger>
      <Tooltip {...args} />
    </Trigger>
  ),
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Under its trigger while it's hovered or keyboard-focused. */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const tip = canvas.getByText("Saturn");
    await expect(tip).not.toBeVisible();
    await expect(tip).toHaveAttribute("aria-hidden", "true");
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Saturn" })).toHaveFocus();
    await waitFor(() => expect(tip).toBeVisible());
  },
};

/** The pointer can move onto it (WCAG 1.4.13): a see-through bridge spans the gap to its trigger, so its hover holds (the hover itself is CSS: checked in a browser). A click on it doesn't press its trigger. */
export const Hoverable: Story = {
  render: (args) => (
    <Trigger onClick={pressed}>
      <Tooltip {...args} />
    </Trigger>
  ),
  play: async ({ canvas }) => {
    const tip = canvas.getByText("Saturn");
    const bridge = getComputedStyle(tip, "::before");
    await expect(bridge.position).toBe("absolute");
    await expect(bridge.height).toBe("6px"); // the gap: `mt-1.5`
    await expect(getComputedStyle(tip).marginTop).toBe("6px");
    pressed.mockClear();
    tip.click();
    await expect(pressed).not.toHaveBeenCalled();
    canvas.getByRole("button", { name: "Saturn" }).click();
    await expect(pressed).toHaveBeenCalledOnce();
  },
};

/** Escape closes it without moving the pointer or the focus (WCAG 1.4.13); it shows again once you move on and come back. */
export const Dismiss: Story = {
  // Never leave the tooltips closed for the next story.
  beforeEach: () => () => {
    delete document.documentElement.dataset.tooltips;
  },
  play: async ({ canvas, userEvent }) => {
    const tip = canvas.getByText("Saturn");
    await userEvent.tab();
    await waitFor(() => expect(tip).toBeVisible());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(tip).not.toBeVisible());
    await expect(canvas.getByRole("button", { name: "Saturn" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await userEvent.tab();
    await waitFor(() => expect(tip).toBeVisible());
  },
};

/** In calm motion: it only fades in, from its place (no slide out of its trigger). */
export const Calm: Story = {
  beforeEach: inCalm,
  play: async ({ canvas, userEvent }) => {
    const tip = canvas.getByText("Saturn");
    const waiting = getComputedStyle(tip).translate; // centred under its trigger: -50%, no offset
    await userEvent.tab();
    await waitFor(() => expect(tip).toBeVisible());
    await expect(getComputedStyle(tip).translate).toBe(waiting);
  },
};

/** The sides it opens on (shown here with `open`). */
export const Sides: Story = {
  args: { open: true },
  parameters: { controls: { exclude: ["side", "open"] } },
  render: (args) => (
    <Gallery values={TOOLTIP_SIDES}>
      {(side) => (
        <span className="p-14">
          <Trigger>
            <Tooltip {...args} side={side} />
          </Trigger>
        </span>
      )}
    </Gallery>
  ),
  play: async ({ canvas }) => {
    const tips = canvas.getAllByText("Saturn");
    await expect(tips).toHaveLength(TOOLTIP_SIDES.length);
    for (const tip of tips) await expect(tip).toBeVisible();
  },
};

/** Above or below: flush with its trigger's start or end edge, or centred. */
export const Aligns: Story = {
  args: { open: true, children: "Close · Esc" },
  parameters: { controls: { exclude: ["align", "open"] } },
  render: (args) => (
    <Gallery values={TOOLTIP_ALIGNS}>
      {(align) => (
        <span className="px-20 pb-10">
          <Trigger>
            <Tooltip {...args} align={align} />
          </Trigger>
        </span>
      )}
    </Gallery>
  ),
};

/** Shows only after a short hover (0.8s), so a passing pointer doesn't flash it. */
export const Delayed: Story = {
  args: { side: "above", delayed: true, children: "Next chapter" },
  play: async ({ canvas, userEvent }) => {
    const tip = canvas.getByText("Next chapter");
    await userEvent.tab();
    await expect(tip).not.toBeVisible();
    await waitFor(() => expect(tip).toBeVisible(), { timeout: 2000 });
  },
};

/** Shown from outside (`open`) and read out as it changes (`live`): a pill that says itself. */
export const OpenLive: Story = {
  args: { side: "right", open: true, live: true, children: "Back to London" },
  play: async ({ canvas }) => {
    const tip = canvas.getByText("Back to London");
    await expect(tip).toBeVisible();
    await expect(tip).toHaveAttribute("aria-live", "polite");
  },
};

/** Its text colour, tuned by a part of the page through `--color-tooltip` (the timeline's dev panel). */
export const TunedColour: Story = {
  args: { open: true },
  decorators: [
    (Story) => (
      <div style={{ "--color-tooltip": "var(--color-baby-blue)" } as CSSProperties}>
        <Story />
      </div>
    ),
  ],
};
