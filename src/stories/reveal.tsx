import type { Decorator } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";
import BookReveal from "#/components/pages/home/book/BookReveal";

/**
 * A calm book part's story (P27-93) with the book's fades: its parts (`data-reveal`) fade in
 * as they show, as in the book.
 */
export const withReveal: Decorator = (Story) => (
  <>
    <Story />
    <BookReveal />
  </>
);

/**
 * Waits for the parts that showed to have faded in fully, so the a11y check that follows
 * measures their colours, not their fade. Parts never shown stay hidden (and unchecked).
 */
export const revealed = (root: Element) =>
  waitFor(
    () => {
      const shown = root.querySelectorAll("[data-reveal][data-in]");
      expect(shown.length).toBeGreaterThan(0);
      shown.forEach((part) => expect(part).toHaveStyle({ opacity: "1" }));
    },
    { timeout: 2000 },
  );
