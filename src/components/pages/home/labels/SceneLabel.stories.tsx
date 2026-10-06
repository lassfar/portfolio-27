import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Camera, MemoryStick } from "lucide-react";
import { expect, fn, userEvent, within } from "storybook/test";

import SceneLabel from "./SceneLabel";

const meta = {
  title: "Home/SceneLabel",
  component: SceneLabel,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#19191C" }] }, // --color-rich-black
  },
  decorators: [
    (Story) => (
      <div className="relative p-12">
        <Story />
      </div>
    ),
  ],
  args: {
    labelKey: "london",
    icon: Camera,
    name: "London",
    meta: "5 shots",
    "aria-label": "Open London: 4 photos and 1 clip",
    className: "relative", // on the site, its overlay positions it (fixed)
    onClick: fn(),
  },
} satisfies Meta<typeof SceneLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A place, before any panel was opened: it breathes a peach ring. Hover it. */
export const Place: Story = {
  args: { fresh: true },
  play: async ({ canvasElement, args }) => {
    const label = within(canvasElement).getByRole("button", { name: "Open London: 4 photos and 1 clip" });
    await expect(label).toHaveAttribute("aria-haspopup", "dialog");
    await expect(label).toHaveAttribute("data-scene-label", "london");
    await expect(label).toHaveTextContent("London· 5 shots");
    await userEvent.click(label);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** Once a panel has been opened: no ring. */
export const PlaceSeen: Story = {};

/** Parker's memory card: opens the Lab. */
export const MemoryCard: Story = {
  args: {
    labelKey: "lab",
    icon: MemoryStick,
    name: "Memory card",
    meta: "open the Lab",
    tone: "card",
    fresh: true,
    "aria-label": "Open Parker's memory card: the Lab experiments",
  },
};
