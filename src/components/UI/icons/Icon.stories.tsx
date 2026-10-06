import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { ICON_ARG_TYPE, SITE_ICONS } from "#/stories/icons";
import Icon, { ICON_STROKE } from "./Icon";

const meta = {
  title: "UI/Icon",
  component: Icon,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-10 text-light-peach">
        <Story />
      </div>
    ),
  ],
  argTypes: { icon: ICON_ARG_TYPE },
  args: { icon: SITE_ICONS.Camera, size: 24 },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

/** One icon: decorative (hidden from screen readers — the control around it names it). */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const svg = canvasElement.querySelector("svg");
    await expect(svg).toHaveAttribute("aria-hidden", "true");
    await expect(svg).toHaveAttribute("stroke-width", String(ICON_STROKE));
  },
};

/** Filled with the text colour (the play button). */
export const Filled: Story = { args: { icon: SITE_ICONS.Play, filled: true } };

/** Every icon on the site, at the sizes they're used (14–17px) and larger. */
export const SiteIcons: Story = {
  parameters: { controls: { exclude: ["icon"] } },
  render: () => (
    <ul className="grid grid-cols-4 gap-6 sm:grid-cols-6">
      {Object.entries(SITE_ICONS).map(([name, glyph]) => (
        <li key={name} className="flex flex-col items-center gap-2 text-2xs text-white/50">
          <span className="flex items-end gap-3 text-light-peach">
            <Icon icon={glyph} size={15} />
            <Icon icon={glyph} size={24} />
          </span>
          {name}
        </li>
      ))}
    </ul>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("listitem")).toHaveLength(Object.keys(SITE_ICONS).length);
  },
};
