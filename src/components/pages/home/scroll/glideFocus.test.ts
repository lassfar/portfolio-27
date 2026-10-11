import { describe, expect, it } from "vitest";
import { needsRefocus } from "./glideFocus";

// Stand-ins for the page: only identity matters to the pick.
const body = {} as Element;
const star = {} as Element;
const shown = () => true;
const hidden = () => false;

describe("needsRefocus", () => {
  it("leaves a focus that's still shown (a star, the orb back in its place)", () => {
    expect(needsRefocus(star, body, shown)).toBe(false);
  });

  it("moves a focus left nowhere (Chrome drops it on <body> when its element hides)", () => {
    expect(needsRefocus(body, body, shown)).toBe(true);
    expect(needsRefocus(null, body, shown)).toBe(true);
  });

  it('moves a focus left on something hidden or inert ("To wander" faded out, the orb at Contact)', () => {
    expect(needsRefocus(star, body, hidden)).toBe(true);
  });
});
