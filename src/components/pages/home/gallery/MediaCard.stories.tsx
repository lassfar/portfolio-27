import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { PHOTO_LOCATIONS } from "#/components/three.js/earth/data";
import MediaCard from "./MediaCard";

const london = PHOTO_LOCATIONS.find((l) => l.id === "london")!;
const photo = london.media.find((m) => m.type === "image")!;
const clip = london.media.find((m) => m.type === "video")!;

const meta = {
  title: "Home/Gallery/MediaCard",
  component: MediaCard,
  decorators: [
    (Story) => (
      <div className="w-72 p-12">
        <Story />
      </div>
    ),
  ],
  args: { item: photo, index: 0, name: "London 01", size: "md", onOpen: fn() },
} satisfies Meta<typeof MediaCard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A photo (a placeholder until its file exists): hover it — the glow follows the pointer, its caption slides in. */
export const Photo: Story = {
  play: async ({ canvasElement, args }) => {
    const card = within(canvasElement).getByRole("button", { name: `Open ${photo.caption}` });
    await expect(card).toHaveAttribute("data-photo", "0");
    await userEvent.click(card);
    await expect(args.onOpen).toHaveBeenCalledOnce();
  },
};

/** A clip: its poster and a play button (it plays in the photo viewer). */
export const Clip: Story = {
  args: { item: clip, index: 4, name: "London 05" },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("video")).toBeNull();
  },
};

/** The side panel's (and a phone's) smaller corners. */
export const Small: Story = { args: { size: "sm", index: 1 } };
