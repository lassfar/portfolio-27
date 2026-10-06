import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import GlowCard from "./GlowCard";

const Picture = () => (
  <span className="relative block aspect-4/5 bg-linear-150 from-[#768496] to-[#282c36] transition-[filter] duration-500 group-hover/card:brightness-108 group-hover/card:saturate-112">
    <span className="grain absolute inset-0" />
  </span>
);

const meta = {
  title: "UI/GlowCard",
  component: GlowCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-72 p-12">
        <Story />
      </div>
    ),
  ],
  args: { children: <Picture />, "aria-label": "Open London 01", onClick: fn() },
} satisfies Meta<typeof GlowCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A photo: hover it — it lifts, and a peach glow behind it follows the pointer. */
export const Photo: Story = {
  play: async ({ canvasElement, args }) => {
    const card = within(canvasElement).getByRole("button", { name: "Open London 01" });
    await userEvent.pointer({ target: card, coords: { clientX: 60, clientY: 80 } });
    await expect(card.style.getPropertyValue("--mx")).not.toBe("");
    await userEvent.click(card);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** Without `onClick`: a plain card (e.g. an experiment that isn't live yet), not focusable. */
export const Static: Story = {
  args: {
    onClick: undefined,
    size: "sm",
    children: (
      <span className="flex aspect-4/3 flex-col justify-end gap-1.5 bg-dark/45 p-6">
        <span className="text-lg font-light text-white/74">Worlds</span>
      </span>
    ),
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).queryByRole("button")).toBeNull();
  },
};
