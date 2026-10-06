import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Camera, Video } from "lucide-react";
import { expect, within } from "storybook/test";

import Tag from "./Tag";

const meta = {
  title: "UI/Tag",
  component: Tag,
  tags: ["autodocs"],
  parameters: {
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#19191C" }] }, // --color-rich-black
  },
  decorators: [
    (Story) => (
      <div className="flex gap-2.5 p-10">
        <Story />
      </div>
    ),
  ],
  args: { icon: Camera, children: "4 photos" },
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A fact under a panel's title. */
export const Photos: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByText("4 photos")).toBeVisible();
  },
};

export const Clip: Story = { args: { icon: Video, children: "1 clip" } };

/** Without an icon. */
export const Plain: Story = { args: { icon: undefined, children: "On Parker's memory card" } };
