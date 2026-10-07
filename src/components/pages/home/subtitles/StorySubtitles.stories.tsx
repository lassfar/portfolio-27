import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useLayoutEffect, type ReactNode } from "react";
import { expect, waitFor } from "storybook/test";

import { useJourneyScroll } from "#/stores/useJourneyScroll";
import StorySubtitles from "./StorySubtitles";
import { STORY_SUBTITLES } from "./config";

/** Parks the journey (the scroll store the subtitles follow) in the middle of subtitle `id`'s window. */
const Parked = ({ id, children }: { id: string; children: ReactNode }) => {
  useLayoutEffect(() => {
    const { window } = STORY_SUBTITLES.find((s) => s.id === id)!;
    useJourneyScroll.setState({ progress: (window[0] + window[1]) / 2 });
    return () => useJourneyScroll.setState({ progress: 0 });
  }, [id]);
  return children;
};

/** The paragraphs that are showing. */
const shown = () => [
  ...document.querySelectorAll<HTMLElement>('.story-subtitle[data-shown="true"]'),
];

/** The subtitles follow the scroll, not props: the story's control picks where the journey is parked. */
type Args = { subtitle: string };

const meta = {
  title: "Home/StorySubtitles",
  component: StorySubtitles,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed to the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "36rem" } },
  },
  argTypes: { subtitle: { control: "select", options: STORY_SUBTITLES.map((s) => s.id) } },
  args: { subtitle: "lab" },
  decorators: [
    (Story, { args }) => (
      <Parked id={args.subtitle}>
        <div className="min-h-screen">
          <Story />
        </div>
      </Parked>
    ),
  ],
  render: () => <StorySubtitles />,
} satisfies Meta<Args>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A chapter's line (pick it in Controls): it writes in, its accent in peach — and only that one shows. */
export const Default: Story = {
  play: async () => {
    await waitFor(() => expect(shown()).toHaveLength(1));
    const [line] = shown();
    await expect(line.textContent).toContain("It never flies straight at the Sun.");
    await expect(line.querySelector(".story-subtitle__accent")?.textContent).toBe(
      "a little closer",
    );
  },
};
