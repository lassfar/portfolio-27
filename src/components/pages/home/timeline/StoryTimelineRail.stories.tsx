import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

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
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "36rem" } },
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
      <div className="min-h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StoryTimelineRail>;

export default meta;

type Story = StoryObj<typeof meta>;

/** In the middle of the story (the Lab): the stars passed in peach, the current one glowing, the rest still hidden. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("button")).toHaveLength(STORY_CHAPTERS.length);
    await expect(canvas.getByRole("button", { name: "The Lab" })).toHaveAttribute("aria-current", "step");
    await expect(canvas.getByRole("button", { name: "The Earth" })).not.toHaveAttribute("aria-current");
  },
};

/** Just started: nothing passed yet. */
export const AtTheStart: Story = { args: at(1, 0.1) };

/** At the end (Contact): every star passed. */
export const AtTheEnd: Story = {
  args: at(STORY_CHAPTERS.length - 1),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Contact" })).toHaveAttribute("aria-current", "step");
  },
};

/** After a moment without scrolling it dims (hover brings it back). */
export const Dimmed: Story = { args: { rest: "dim" } };

/** Phones: no hover tooltips; a new chapter's name pops up by its star, read out. */
export const Phone: Story = {
  args: { phone: true, toast: { index: 5, on: true } },
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: async ({ canvas }) => {
    const pill = canvas.getByText(STORY_CHAPTERS[5].name); // the only one: phones have no tooltips
    await expect(pill).toHaveAttribute("aria-live", "polite");
    await waitFor(() => expect(pill).toBeVisible());
  },
};
