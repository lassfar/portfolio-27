import { describe, expect, it } from "vitest";
import { fillClip } from "./layout";

describe("the timeline fill's clip", () => {
  it("shows the rail from its start as far as the fill, with round ends", () => {
    expect(fillClip(0.25, false)).toBe("inset(0 0 75% 0 round 9999px)");
    expect(fillClip(0.25, true)).toBe("inset(0 75% 0 0 round 9999px)");
  });

  it("shows nothing at 0 and the whole rail at 1", () => {
    expect(fillClip(0, false)).toBe("inset(0 0 100% 0 round 9999px)");
    expect(fillClip(1, true)).toBe("inset(0 0% 0 0 round 9999px)");
  });
});
