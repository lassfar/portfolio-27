import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { BOOK_CHAPTERS, titleId } from "#/components/pages/home/book/chapters";
import { BOOK } from "#/components/pages/home/story/copy";
import { inCalm } from "#/stories/motion";
import { revealed } from "#/stories/reveal";
import CalmBook from "./CalmBook";

/** The calm book, whole, in calm motion (where the site shows it). */
const meta = {
  title: "Home/Book/CalmBook",
  component: CalmBook,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, height: "40rem" } },
  },
  beforeEach: [
    inCalm,
    // Back to the top for the next story.
    () => () => window.scrollTo(0, 0),
  ],
} satisfies Meta<typeof CalmBook>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The story as a book: the star's cover, then the chapters, each shape beside its words, bridges between them, "You are here", and Contact. Past the cover, the journey's timeline (on the right) jumps to any chapter. */
export const Default: Story = {
  play: async ({ canvas, canvasElement, userEvent, step }) => {
    await step("one h1, a heading for each chapter, a figure for each shape", async () => {
      await expect(canvas.getAllByRole("heading", { level: 1 })).toHaveLength(1);
      BOOK_CHAPTERS.forEach((id) =>
        expect(document.getElementById(titleId(id))).toBeInTheDocument(),
      );
      for (const label of Object.values(BOOK.figures))
        await expect(canvas.getByRole("img", { name: label })).toBeInTheDocument();
      await expect(canvas.getByText(BOOK.ending)).toBeInTheDocument();
    });

    await step("past the cover, the timeline jumps to the Milky Way, at once", async () => {
      document.getElementById("maker")!.scrollIntoView({ behavior: "instant" });
      const star = () =>
        document.querySelector<HTMLButtonElement>(
          'nav.story-timeline button[aria-label="The Milky Way"]',
        )!;
      await waitFor(() => expect(star()).toBeVisible());
      await userEvent.click(star());
      const chapter = document.getElementById("milky-way")!;
      await waitFor(() => expect(Math.abs(chapter.getBoundingClientRect().top)).toBeLessThan(2));
      await waitFor(() => expect(star()).toHaveAttribute("aria-current", "step"));
      await expect(document.getElementById(titleId("milky-way"))).toHaveFocus();
    });

    await revealed(canvasElement);
  },
};
