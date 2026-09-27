import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { useJourneyScroll } from "#/stores/useJourneyScroll";
import StoryTitle from "./StoryTitle";
import { STORY_CHAPTERS } from "./config";

/** Parks the story inside chapter `id` for the story's render. */
const inChapter = (id: string) => () => {
  const i = STORY_CHAPTERS.findIndex((c) => c.id === id);
  const next = STORY_CHAPTERS[i + 1]?.start ?? 1;
  useJourneyScroll.setState({ progress: (STORY_CHAPTERS[i].start + next) / 2 });
  return () => useJourneyScroll.setState({ progress: 0 });
};

const meta = {
  title: "Home/StoryTitle",
  component: StoryTitle,
  parameters: {
    layout: "fullscreen",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#19191C" }],
    }, // --color-rich-black
  },
  decorators: [
    (Story) => (
      <div style={{ minHeight: "100vh", background: "#19191C" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StoryTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Deep in the 3D scenes: the title still says where you are. */
export const AtTheEarth: Story = {
  beforeEach: inChapter("earth"),
  play: async () => {
    await waitFor(() =>
      expect(document.querySelector(".story-title__label")?.textContent).toBe(
        "The Earth",
      ),
    );
  },
};

export const OnTheWayOut: Story = { beforeEach: inChapter("way-out") };
