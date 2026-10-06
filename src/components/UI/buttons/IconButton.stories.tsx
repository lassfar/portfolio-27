import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ChevronRight, Maximize2, PanelRight, X } from "lucide-react";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";

import IconButton from "./IconButton";

const meta = {
  title: "UI/IconButton",
  component: IconButton,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="flex min-h-40 items-start justify-center p-10">
        <Story />
      </div>
    ),
  ],
  args: { icon: X, label: "Close", tooltip: "Close · Esc", onClick: fn() },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Close, with its tooltip under it on hover / keyboard focus. */
export const Close: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: "Close" });
    const tip = canvas.getByText("Close · Esc");
    await expect(tip).not.toBeVisible();
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(tip).toBeVisible());
    await userEvent.keyboard("{Enter}");
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** The panel's mode switch, in the full view. */
export const SidePanel: Story = {
  args: { icon: PanelRight, label: "Show as a side panel", tooltip: "Side panel" },
};

/** …and in the side panel. */
export const FullView: Story = {
  args: { icon: Maximize2, label: "Open the full view", tooltip: "Full view" },
};

/** The photo viewer's arrows: no tooltip. */
export const Arrow: Story = {
  args: { icon: ChevronRight, label: "Next photo", tooltip: undefined },
};
