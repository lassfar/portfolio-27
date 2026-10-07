import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import { ICON_ARG_TYPE, SITE_ICONS } from "#/stories/icons";
import { inCalm } from "#/stories/motion";
import { TOOLTIP_ALIGNS } from "#/components/UI/tooltip/tooltip.types";
import IconButton from "./IconButton";

const meta = {
  title: "UI/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      // Room for its tooltip, under it.
      <div className="pb-10">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    icon: ICON_ARG_TYPE,
    tooltipAlign: { control: "inline-radio", options: TOOLTIP_ALIGNS },
  },
  args: { icon: SITE_ICONS.X, label: "Close", tooltip: "Close · Esc", onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Any icon (Controls), named by its label; its tooltip shows on hover or keyboard focus. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: "Close" });
    const tip = canvas.getByText("Close · Esc");
    await expect(tip).not.toBeVisible();
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(tip).toBeVisible());
    // With motion, it springs up as it's focused.
    await waitFor(() => expect(getComputedStyle(button).translate).not.toBe("none"));
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** In calm motion: focused or hovered, it only lights up (glow, peach ring): no spring, no growing, and its light stays put. */
export const Calm: Story = {
  beforeEach: inCalm,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Close" });
    await userEvent.pointer({ target: button, coords: { clientX: 12, clientY: 12 } });
    await expect(button.style.getPropertyValue("--mx")).toBe("");
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByText("Close · Esc")).toBeVisible());
    await expect(getComputedStyle(button).translate).toBe("none");
    await expect(getComputedStyle(button).scale).toBe("none");
  },
};

/** A toggle, pressed (`pressed`: the motion switch): `aria-pressed`, and it stays peach. */
export const Pressed: Story = {
  args: {
    icon: SITE_ICONS.Calm,
    label: "Reduce motion",
    tooltip: "Calm motion · on",
    pressed: true,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Reduce motion" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

/** Without a tooltip: only its accessible name (the photo viewer's arrows). */
export const WithoutTooltip: Story = {
  args: { icon: SITE_ICONS.ChevronRight, label: "Next photo", tooltip: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Next photo" })).toHaveTextContent("");
  },
};
