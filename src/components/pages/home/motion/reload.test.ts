import { afterEach, describe, expect, it, vi } from "vitest";
import { choiceKept, reloadAddress } from "#/components/pages/home/motion/reload";

const at = "https://lassfar.dev/?perf#lab";

describe("reloading into the other mode", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lands at the top: the chapter's hash goes, the rest of the address stays", () => {
    expect(reloadAddress(at, "calm", true)).toBe("/?perf");
    expect(reloadAddress("https://lassfar.dev/", "full", true)).toBe("/");
  });

  it("knows whether the browser kept the choice, against this device setting", () => {
    vi.stubGlobal("localStorage", { getItem: () => "full:reduce" });
    expect(choiceKept("full", true)).toBe(true);
    expect(choiceKept("full", false)).toBe(false);
    expect(choiceKept("calm", true)).toBe(false);
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("storage blocked");
      },
    });
    expect(choiceKept("full", true)).toBe(false);
  });

  it("carries the choice in the address only when the browser couldn't keep it", () => {
    expect(reloadAddress(at, "calm", false)).toBe("/?perf=&motion=calm");
    expect(reloadAddress("https://lassfar.dev/?motion=calm", "full", false)).toBe("/?motion=full");
    // Kept this time: the address's old choice goes, so the stored one counts.
    expect(reloadAddress("https://lassfar.dev/?motion=calm", "full", true)).toBe("/");
  });
});
