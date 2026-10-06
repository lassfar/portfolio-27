import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { useJourneyScroll } from "#/stores/useJourneyScroll";
import StorySubtitles from "./StorySubtitles";
import { STORY_SUBTITLES } from "./config";

/** Parks the story in the middle of subtitle `id`'s window for the story's render. */
const onSubtitle = (id: string) => () => {
  const { window } = STORY_SUBTITLES.find((s) => s.id === id)!;
  useJourneyScroll.setState({ progress: (window[0] + window[1]) / 2 });
  return () => useJourneyScroll.setState({ progress: 0 });
};

/** The paragraphs that are showing. */
const shown = () => [...document.querySelectorAll<HTMLElement>('.story-subtitle[data-shown="true"]')];

const meta = {
  title: "Home/StorySubtitles",
  component: StorySubtitles,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StorySubtitles>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The Parker Solar Probe's close-up: the Lab's line writes in, its accent in peach — and only that one shows. */
export const InTheLab: Story = {
  beforeEach: onSubtitle("lab"),
  play: async () => {
    await waitFor(() => expect(shown()).toHaveLength(1));
    const [line] = shown();
    expect(line.textContent).toContain("It never flies straight at the Sun.");
    expect(line.querySelector(".story-subtitle__accent")?.textContent).toBe("a little closer");
  },
};

/** The Earth up close, with its photo pins. */
export const DivingToTheEarth: Story = { beforeEach: onSubtitle("earth") };

/** The full Milky Way, handing over to Contact. */
export const OutToTheMilkyWay: Story = { beforeEach: onSubtitle("milky-way") };
