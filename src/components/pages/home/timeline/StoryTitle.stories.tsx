import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLayoutEffect, type ReactNode } from "react";
import { expect, waitFor } from "storybook/test";

import { useJourneyScroll } from "#/stores/useJourneyScroll";
import StoryTitle from "./StoryTitle";
import { STORY_CHAPTERS } from "./config";

const chapterOf = (id: string) => STORY_CHAPTERS.find((c) => c.id === id)!;

/** Parks the journey (the scroll store the title follows) inside chapter `id`. */
const Parked = ({ id, children }: { id: string; children: ReactNode }) => {
  useLayoutEffect(() => {
    const i = STORY_CHAPTERS.findIndex((c) => c.id === id);
    const next = STORY_CHAPTERS[i + 1]?.start ?? 1;
    useJourneyScroll.setState({ progress: (STORY_CHAPTERS[i].start + next) / 2 });
    return () => useJourneyScroll.setState({ progress: 0 });
  }, [id]);
  return children;
};

/** The title follows the scroll, not props: the story's control picks where the journey is parked. */
type Args = { chapter: string };

const meta = {
  title: "Home/StoryTitle",
  component: StoryTitle,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "36rem" } },
  },
  argTypes: { chapter: { control: "select", options: STORY_CHAPTERS.map((c) => c.id) } },
  args: { chapter: "earth" },
  decorators: [
    (Story, { args }) => (
      <Parked id={args.chapter}>
        <div className="min-h-screen">
          <Story />
        </div>
      </Parked>
    ),
  ],
  render: () => <StoryTitle />,
} satisfies Meta<Args>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The chapter you're in (pick it in Controls), on the left edge — even deep in the 3D scenes. */
export const Default: Story = {
  play: async ({ args }) => {
    const name = chapterOf(args.chapter).name;
    await waitFor(() => expect(document.querySelector(".story-title__label")?.textContent).toBe(name));
  },
};
