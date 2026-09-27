import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";

import StoryTimelineRail from "./StoryTimelineRail";
import { STORY_CHAPTERS, TIMELINE } from "./config";
import { chapterAt, chapterPositions, fillAt } from "./layout";

// The rail as it sits on a 760px-tall screen.
const positions = chapterPositions(STORY_CHAPTERS, TIMELINE.minGap, (760 * TIMELINE.railLength) / 100);

/** The rail's state a share `t` of the way through chapter `i`. */
function at(i: number, t = 0.4) {
  const start = STORY_CHAPTERS[i].start;
  const end = STORY_CHAPTERS[i + 1]?.start ?? 1;
  const mp = start + (end - start) * t;
  return { current: chapterAt(STORY_CHAPTERS, mp), fill: fillAt(STORY_CHAPTERS, positions, mp) };
}

const meta = {
  title: "Home/StoryTimeline",
  component: StoryTimelineRail,
  parameters: {
    layout: "fullscreen",
    backgrounds: { default: "dark", values: [{ name: "dark", value: "#19191C" }] }, // --color-rich-black
  },
  args: {
    chapters: STORY_CHAPTERS,
    positions,
    ...at(5),
    shown: true,
    rest: "awake",
    phone: false,
  },
  argTypes: {
    current: { control: { type: "range", min: 0, max: STORY_CHAPTERS.length - 1, step: 1 } },
    fill: { control: { type: "range", min: 0, max: 1, step: 0.01 } },
    onSelect: { action: "selected" },
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: "100vh", background: "#19191C" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StoryTimelineRail>;

export default meta;

type Story = StoryObj<typeof meta>;

/** In the Lab: the first five stars passed, the Lab's glowing, the rest still hidden. */
export const InTheLab: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("button")).toHaveLength(STORY_CHAPTERS.length);
    await expect(canvas.getByRole("button", { name: "The Lab" })).toHaveAttribute("aria-current", "step");
    await expect(canvas.getByRole("button", { name: "The Earth" })).not.toHaveAttribute("aria-current");
  },
};

export const JustStarted: Story = { args: at(1, 0.1) };

export const AtContact: Story = {
  args: at(STORY_CHAPTERS.length - 1),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("button", { name: "Contact" })).toHaveAttribute("aria-current", "step");
  },
};

/** After a moment without scrolling it dims (hover brings it back). */
export const Dimmed: Story = { args: { rest: "dim" } };

/** Phones: no hover tooltips; a new chapter's name pops up by its star. */
export const Phone: Story = {
  args: { phone: true, toast: { index: 5, on: true } },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
