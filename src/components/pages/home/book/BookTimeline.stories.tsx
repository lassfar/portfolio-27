import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { BOOK_CHAPTERS, titleId } from "#/components/pages/home/book/chapters";
import { CHAPTER_NAMES } from "#/components/pages/home/story/copy";
import { RAIL_CLEAR } from "#/components/pages/home/timeline/layout";
import { contrastOnPage } from "#/stories/contrast";
import { inCalm } from "#/stories/motion";
import { sideways } from "#/stories/viewports";
import BookTimeline from "./BookTimeline";

const timeline = () => document.querySelector<HTMLElement>("nav.story-timeline")!;
/** The timeline's star for a chapter. */
const starOf = (name: string) =>
  document.querySelector<HTMLButtonElement>(`nav.story-timeline button[aria-label="${name}"]`)!;
const shown = () => waitFor(() => expect(getComputedStyle(timeline()).visibility).toBe("visible"));

/** The calm book's timeline: the journey's, driven by the book's scroll. Here over the book's chapters, a screen each. */
const meta = {
  title: "Home/Book/BookTimeline",
  component: BookTimeline,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    docs: { story: { inline: false, height: "30rem" } },
  },
  decorators: [
    (Story) => (
      <div>
        <Story />
        {BOOK_CHAPTERS.map((id) => (
          <section key={id} id={id} aria-labelledby={titleId(id)} className="h-screen px-6 py-20">
            <h2 id={titleId(id)} tabIndex={-1} className="text-2xl text-white/80 outline-none">
              {CHAPTER_NAMES[id]}
            </h2>
          </section>
        ))}
      </div>
    ),
  ],
  // The book is calm: nothing breathes or grows. Back to the top for the next story.
  beforeEach: [inCalm, () => () => window.scrollTo(0, 0)],
} satisfies Meta<typeof BookTimeline>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Hidden on the cover; past it, one star per chapter on the right, the chapters ahead shown too. The current one is marked; each names itself on hover or focus. */
export const Default: Story = {
  play: async () => {
    await expect(getComputedStyle(timeline()).visibility).toBe("hidden");
    document.getElementById("maker")!.scrollIntoView({ behavior: "instant" });
    await shown();
    await expect(timeline().querySelectorAll("button")).toHaveLength(BOOK_CHAPTERS.length);
    await waitFor(() => expect(starOf("The Maker")).toHaveAttribute("aria-current", "step"));
    // On the right, like the journey's.
    await expect(timeline().getBoundingClientRect().left).toBeGreaterThan(window.innerWidth / 2);
  },
};

/** A click jumps to the chapter at once (nothing scrolls on its own) and its heading takes the focus. Calm: the current star neither breathes nor grows. */
export const Jump: Story = {
  play: async ({ userEvent }) => {
    document.getElementById("maker")!.scrollIntoView({ behavior: "instant" });
    await shown();
    await userEvent.click(starOf("The Lab"));
    const lab = document.getElementById("lab")!;
    await waitFor(() => expect(Math.abs(lab.getBoundingClientRect().top)).toBeLessThan(2));
    await waitFor(() => expect(starOf("The Lab")).toHaveAttribute("aria-current", "step"));
    await expect(document.getElementById(titleId("lab"))).toHaveFocus();
    const glyph = starOf("The Lab").querySelector(".story-timeline__glyph")!;
    await expect(getComputedStyle(glyph).animationName).toBe("none");
  },
};

/** Focused from the keyboard: the site's focus ring, 3:1 or more (WCAG 1.4.11). Back up on the cover it stays shown while it holds the focus, so the focus isn't lost (2.4.7). */
export const Focused: Story = {
  play: async ({ userEvent }) => {
    document.getElementById("maker")!.scrollIntoView({ behavior: "instant" });
    await shown();
    await userEvent.tab();
    const star = starOf("Origin");
    await expect(star).toHaveFocus();
    const ring = getComputedStyle(star);
    await expect(ring.outlineStyle).toBe("solid");
    await expect(contrastOnPage(ring.outlineColor)).toBeGreaterThanOrEqual(3);
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 700));
    await expect(star).toHaveFocus();
    await expect(getComputedStyle(timeline()).visibility).toBe("visible");
  },
};

/** On a phone: no hover names; a new chapter's name shows by its star for a moment (not read out: the chapters are headings). */
export const Phone: Story = {
  globals: { viewport: { value: "mobile1", isRotated: false } },
  play: async () => {
    document.getElementById("maker")!.scrollIntoView({ behavior: "instant" });
    await shown();
    document.getElementById("craft")!.scrollIntoView({ behavior: "instant" });
    const name = await waitFor(() => {
      const pill = within(timeline()).getByText("The Craft", { selector: ".absolute > span" });
      expect(pill).toBeVisible();
      return pill;
    });
    await expect(name).toHaveAttribute("aria-hidden", "true");
    await expect(starOf("The Craft").querySelector("span[aria-hidden='true'] + span")).toBeNull();
  },
};

/** On a phone held sideways (568 × 320): a touch screen, so a new chapter's name shows by its star; the rail stays long enough to keep the stars 32 px apart (WCAG 2.5.8), and starts below the Reduce motion switch's corner. */
export const PhoneSideways: Story = {
  ...sideways,
  play: async () => {
    await expect(window.innerHeight).toBe(320);
    document.getElementById("maker")!.scrollIntoView({ behavior: "instant" });
    await shown();
    const centres = [...timeline().querySelectorAll("button")].map((b) => {
      const r = b.getBoundingClientRect();
      return r.top + r.height / 2;
    });
    centres.slice(1).forEach((y, i) => expect(y - centres[i]).toBeGreaterThanOrEqual(31.5));
    await expect(centres[0]).toBeGreaterThanOrEqual(RAIL_CLEAR.top);
  },
};
