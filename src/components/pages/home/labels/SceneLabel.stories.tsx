import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import Gallery from "#/stories/Gallery";
import { ICON_ARG_TYPE, SITE_ICONS } from "#/stories/icons";
import SceneLabel from "./SceneLabel";
import { SCENE_LABEL_TONES } from "./sceneLabel.types";

const meta = {
  title: "Home/Labels/SceneLabel",
  component: SceneLabel,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    icon: ICON_ARG_TYPE,
    tone: { control: "inline-radio", options: SCENE_LABEL_TONES },
  },
  args: {
    labelKey: "london",
    icon: SITE_ICONS.Camera,
    name: "London",
    meta: "5 shots",
    "aria-label": "Open London: 4 photos and 1 clip",
    className: "relative", // on the site, its overlay positions it (fixed)
    onClick: fn(),
  },
} satisfies Meta<typeof SceneLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Before any panel was opened: it breathes a peach ring, so it reads as something to click. Hover it. */
export const Fresh: Story = {
  args: { fresh: true },
  play: async ({ canvas, userEvent, args }) => {
    const label = canvas.getByRole("button", { name: "Open London: 4 photos and 1 clip" });
    await expect(label).toHaveAttribute("aria-haspopup", "dialog");
    await expect(label).toHaveAttribute("data-scene-label", "london");
    await expect(label).toHaveTextContent("London· 5 shots");
    await userEvent.click(label);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

/** Once a panel has been opened: no ring. */
export const Seen: Story = {};

/** `place` (light peach) for the Earth's places, `card` (peach) for Parker's memory card. */
export const Tones: Story = {
  parameters: { controls: { exclude: ["tone"] } },
  render: (args) => <Gallery values={SCENE_LABEL_TONES}>{(tone) => <SceneLabel {...args} tone={tone} />}</Gallery>,
};
