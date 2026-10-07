import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import Gallery from "#/stories/Gallery";
import { inCalm } from "#/stories/motion";
import GlowCard from "./GlowCard";
import { GLOW_CARD_SIZES } from "./card.types";

const Picture = () => (
  <span className="relative block aspect-4/5 bg-linear-150 from-[#768496] to-[#282c36] transition-[filter] duration-500 group-hover/card:brightness-108 group-hover/card:saturate-112">
    <span className="absolute inset-0 grain" />
  </span>
);

const meta = {
  title: "UI/GlowCard",
  component: GlowCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    size: { control: "inline-radio", options: GLOW_CARD_SIZES },
    children: { control: false },
  },
  args: { children: <Picture />, "aria-label": "Open London 01", onClick: fn() },
  // It fills its column: one column's width here.
  render: (args) => (
    <div className="w-72">
      <GlowCard {...args} />
    </div>
  ),
} satisfies Meta<typeof GlowCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** With `onClick`: a button — hover it, it lifts and a peach glow behind it follows the pointer. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const card = canvas.getByRole("button", { name: "Open London 01" });
    await userEvent.pointer({ target: card, coords: { clientX: 60, clientY: 80 } });
    await expect(card.style.getPropertyValue("--mx")).not.toBe("");
    await userEvent.tab();
    await waitFor(() => expect(getComputedStyle(card).translate).not.toBe("none")); // it lifts
    await userEvent.click(card);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** In calm motion: it only glows, its edge lit; no lift, and the lights stay put. */
export const Calm: Story = {
  beforeEach: inCalm,
  play: async ({ canvas, userEvent }) => {
    const card = canvas.getByRole("button", { name: "Open London 01" });
    await userEvent.pointer({ target: card, coords: { clientX: 60, clientY: 80 } });
    await expect(card.style.getPropertyValue("--mx")).toBe("");
    await userEvent.tab();
    await expect(card).toHaveFocus();
    await new Promise((settle) => setTimeout(settle, 600)); // past the lift's 550ms, had there been one
    await expect(getComputedStyle(card).translate).toBe("none");
  },
};

/** Without `onClick`: a plain card (an experiment that isn't live yet), not focusable. */
export const Static: Story = {
  args: { onClick: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

/** Its corners: `md` in the full view, `sm` at the side and on phones. */
export const Sizes: Story = {
  parameters: { controls: { exclude: ["size"] } },
  render: (args) => (
    <Gallery values={GLOW_CARD_SIZES}>
      {(size) => (
        <div className="w-56">
          <GlowCard {...args} size={size} />
        </div>
      )}
    </Gallery>
  ),
};
