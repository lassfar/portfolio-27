import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { GLOW_CARD_SIZES } from "#/components/UI/cards/card.types";
import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import MediaCard from "./MediaCard";

const london = PHOTO_LOCATIONS.find((l) => l.id === "london")!;
const photo = london.media.find((m) => m.type === "image")!;
const clip = london.media.find((m) => m.type === "video")!;

const meta = {
  title: "Home/Gallery/MediaCard",
  component: MediaCard,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      // One cell of a place's grid.
      <div className="w-72">
        <Story />
      </div>
    ),
  ],
  argTypes: { size: { control: "inline-radio", options: GLOW_CARD_SIZES } },
  args: { item: photo, index: 0, name: "London 01", size: "md", onOpen: fn() },
} satisfies Meta<typeof MediaCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A photo (a placeholder until its file exists): hover it — the glow follows the pointer, its caption slides in. */
export const Default: Story = {
  play: async ({ canvas, userEvent, args }) => {
    const card = canvas.getByRole("button", { name: `Open ${photo.caption}` });
    await expect(card).toHaveAttribute("data-photo", "0");
    await userEvent.click(card);
    await expect(args.onOpen).toHaveBeenCalledOnce();
  },
};

/** A clip: its poster and a play button (it plays in the photo viewer, not here). */
export const Clip: Story = {
  args: { item: clip, index: 4, name: "London 05" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("video")).toBeNull();
  },
};
