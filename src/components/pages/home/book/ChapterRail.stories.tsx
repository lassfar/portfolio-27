import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { BOOK_CHAPTERS, titleId } from "#/components/pages/home/book/chapters";
import { CHAPTER_NAMES } from "#/components/pages/home/story/copy";
import ChapterRail from "./ChapterRail";

/** The rail's link to a chapter. */
const linkTo = (name: string) =>
  document.querySelector<HTMLAnchorElement>(`nav a[aria-label="${name}"]`)!;

const meta = {
  title: "Home/Book/ChapterRail",
  component: ChapterRail,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, height: "30rem" } },
  },
  decorators: [
    (Story) => (
      // The book's chapters, a screen each, for it to follow.
      <div className="pl-24">
        <Story />
        {BOOK_CHAPTERS.map((id) => (
          <section key={id} id={id} aria-labelledby={titleId(id)} className="h-screen py-20">
            <h2 id={titleId(id)} tabIndex={-1} className="text-2xl text-white/80 outline-none">
              {CHAPTER_NAMES[id]}
            </h2>
          </section>
        ))}
      </div>
    ),
  ],
  // Back to the top for the next story.
  beforeEach: () => () => window.scrollTo(0, 0),
} satisfies Meta<typeof ChapterRail>;

export default meta;

type Story = StoryObj<typeof meta>;

/** At the top: Origin is current, its name shown; the others name themselves on hover or focus. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const nav = canvas.getByRole("navigation", { name: "Chapters" });
    await expect(nav.querySelectorAll("a")).toHaveLength(BOOK_CHAPTERS.length);
    await expect(linkTo("Origin")).toHaveAttribute("aria-current", "location");
    await expect(within(linkTo("Origin")).getByText("Origin")).toBeVisible();
  },
};

/** A click jumps to the chapter, at once (nothing scrolls on its own), and its heading takes the focus; the chapters before it are passed. */
export const Jump: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(linkTo("The Lab"));
    const lab = document.getElementById("lab")!;
    await waitFor(() => expect(Math.abs(lab.getBoundingClientRect().top)).toBeLessThan(2));
    await waitFor(() => expect(linkTo("The Lab")).toHaveAttribute("aria-current", "location"));
    await expect(linkTo("Origin")).not.toHaveAttribute("aria-current");
    await waitFor(() => expect(document.getElementById(titleId("lab"))).toHaveFocus());
  },
};
