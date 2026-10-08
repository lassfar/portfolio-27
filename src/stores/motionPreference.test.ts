import { describe, expect, it } from "vitest";
import { choiceAddress } from "./motionPreference";

const at = "https://lassfar.dev/?perf#lab";

describe("the address carrying a choice", () => {
  it("carries it only when the browser couldn't keep it, the place kept", () => {
    expect(choiceAddress(at, "calm", false)).toBe("/?perf=&motion=calm#lab");
    expect(choiceAddress("https://lassfar.dev/?motion=calm#earth", "full", false)).toBe(
      "/?motion=full#earth",
    );
  });

  it("takes an old one out once the choice is kept, or gone", () => {
    expect(choiceAddress("https://lassfar.dev/?motion=calm#lab", "full", true)).toBe("/#lab");
    expect(choiceAddress("https://lassfar.dev/?motion=calm", null, false)).toBe("/");
  });

  it("leaves an address that's already right alone", () => {
    expect(choiceAddress(at, "calm", true)).toBeNull();
    expect(choiceAddress(at, null, false)).toBeNull();
    expect(choiceAddress("https://lassfar.dev/?motion=calm", "calm", false)).toBeNull();
  });
});
