import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor, within } from "storybook/test";

import { BOOK_CHAPTERS } from "#/components/pages/home/book/chapters";
import { CHAPTER_IDS } from "#/components/pages/home/story/story.types";
import { contrastOnPage } from "#/stories/contrast";
import { inCalm } from "#/stories/motion";
import ModeVeil from "./ModeVeil";

const veil = () => document.querySelector<HTMLElement>("[data-mode-veil]")!;
const shown = () => waitFor(() => expect(getComputedStyle(veil()).opacity).toBe("1"));
/** What animates in the veil: its own fade, and anything in it. */
const animations = () =>
  document
    .getAnimations()
    .filter((a) => {
      const target = (a.effect as KeyframeEffect | null)?.target;
      return target instanceof Element && veil().contains(target);
    })
    .map((a) =>
      a instanceof CSSTransition
        ? `transition:${a.transitionProperty}`
        : `animation:${(a as CSSAnimation).animationName}`,
    );
/** The constellation's stars and links (its paths: a link has a pathLength). */
const stars = () => veil().querySelectorAll("svg path:not([pathLength])");
const links = () => veil().querySelectorAll("svg path[pathLength]");

/**
 * The transition screen between the modes (P27-94): while the other mode mounts behind it, it
 * shows where the visitor lands, among that mode's chapters. The site mounts it for a switch
 * (it fades in as it mounts) and fades it out once the page is ready.
 */
const meta = {
  title: "Home/Motion/ModeVeil",
  component: ModeVeil,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    // Fixed over the screen: on the docs page, each story in its own frame.
    docs: { story: { inline: false, height: "28rem" } },
  },
  args: { shown: true, to: "calm", place: "earth" },
} satisfies Meta<typeof ModeVeil>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Into calm: the book's seven chapters, the landing one lit and named, "Same story, quieter." Only its opacity changes (WCAG 2.3.3); its words read at 4.5:1 or more (1.4.3). */
export const IntoCalm: Story = {
  beforeEach: inCalm,
  play: async () => {
    const page = within(veil());
    await expect(page.getByText("quieter")).toBeInTheDocument();
    await expect(page.getByText(/Chapter 4 of 7 · Reduce motion on/)).toBeInTheDocument();
    await expect(stars()).toHaveLength(BOOK_CHAPTERS.length);
    await expect(veil().querySelector("svg text")).toHaveTextContent("The Earth");
    for (const name of animations())
      await expect(name).toMatch(/^transition:(opacity|visibility)$/);
    await shown();
    const eyebrow = page.getByText(/Chapter 4 of 7/);
    await expect(contrastOnPage(getComputedStyle(eyebrow).color)).toBeGreaterThanOrEqual(4.5);
    // Its name is in its words too, for screen readers: the constellation is decorative.
    await expect(veil().querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    await expect(eyebrow).toHaveTextContent("The Earth, Chapter 4 of 7");
  },
};

/** Back to motion: the journey's nine chapters; the links up to the landing star draw in, once, one after the other. */
export const ToMotion: Story = {
  args: { to: "full" },
  play: async () => {
    const page = within(veil());
    await expect(page.getByText("whole journey")).toBeInTheDocument();
    await expect(page.getByText(/Chapter 5 of 9 · Reduce motion off/)).toBeInTheDocument();
    await expect(stars()).toHaveLength(CHAPTER_IDS.length);
    await expect(links()).toHaveLength(4);
    const draw = getComputedStyle(links()[3]);
    await expect(draw.animationName).toBe("veil-draw");
    await expect(draw.animationIterationCount).toBe("1");
    await expect(draw.animationDelay).toBe("0.36s");
    await waitFor(() => expect(getComputedStyle(links()[3]).strokeDashoffset).toBe("0px"));
  },
};

/** A passage (here The Voyage) has no chapter in the book: the one before it is lit, under the passage's name. */
export const Passage: Story = {
  args: { place: "voyage" },
  beforeEach: inCalm,
  play: async () => {
    const page = within(veil());
    await expect(veil().querySelector("svg text")).toHaveTextContent("The Voyage");
    await expect(page.getByText(/Between chapters 3 and 4/)).toBeInTheDocument();
    await expect(links()).toHaveLength(2);
  },
};

/** The 3D taking its time: the screen says so (a status line announces it too, on the site). */
export const Slow: Story = {
  args: { to: "full", slow: true },
  play: async () => {
    const line = within(veil()).getByText("Bringing the 3D in…");
    await shown();
    await expect(contrastOnPage(getComputedStyle(line).color)).toBeGreaterThanOrEqual(4.5);
  },
};

/** Fading out once the page is ready: hidden, so nothing in it is read or reached. */
export const Hidden: Story = {
  args: { shown: false },
  play: async () => {
    // At once: clicks and the focus go through while it fades.
    await expect(getComputedStyle(veil()).pointerEvents).toBe("none");
    await expect(veil()).toHaveAttribute("aria-hidden", "true");
    await waitFor(() => expect(getComputedStyle(veil()).visibility).toBe("hidden"));
  },
};
