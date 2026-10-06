import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { ICON_ARG_TYPE, SITE_ICONS } from "#/stories/icons";
import Tag from "./Tag";

const meta = {
  title: "UI/Tag",
  component: Tag,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: { icon: ICON_ARG_TYPE },
  args: { icon: SITE_ICONS.Camera, children: "4 photos" },
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A fact (a panel's "4 photos"), its icon in peach. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("4 photos")).toBeVisible();
  },
};

export const WithoutIcon: Story = {
  args: { icon: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("4 photos").querySelector("svg")).toBeNull();
  },
};
