import { expect, waitFor } from "storybook/test";

/**
 * Waits for a panel's entrance to end (P27-82): every part (`data-rise`) fully risen in. A
 * play ends with it when the panel just opened, so the a11y check that follows measures
 * the parts' colours, not their fade.
 */
export const entered = (root: Element) =>
  waitFor(
    () =>
      root
        .querySelectorAll("[data-rise]")
        .forEach((part) => expect(part).toHaveStyle({ opacity: "1" })),
    {
      timeout: 3000, // a full panel's entrance: up to 12 staggered parts, ~1.3s
    },
  );
