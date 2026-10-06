import { describe, expect, it } from "vitest";
import { isAssistantVisible, liftStep, type LiftContext } from "./lift";

const dotGliding: LiftContext = { visible: true, revealIdle: true, gliding: true };
const buttonGliding: LiftContext = { visible: true, revealIdle: false, gliding: true };
const settled: LiftContext = { visible: true, revealIdle: true, gliding: false };
const away: LiftContext = { visible: false, revealIdle: true, gliding: false };

describe("isAssistantVisible", () => {
  it("shows past the hero, with a next chapter and no panel open", () => {
    expect(isAssistantVisible({ past: true, hasStop: true, panelOpen: false })).toBe(true);
  });
  it("stays away on the hero's first screen, at the end, or behind a panel", () => {
    expect(isAssistantVisible({ past: false, hasStop: true, panelOpen: false })).toBe(false);
    expect(isAssistantVisible({ past: true, hasStop: false, panelOpen: false })).toBe(false);
    expect(isAssistantVisible({ past: true, hasStop: true, panelOpen: true })).toBe(false);
  });
});

describe("liftStep", () => {
  it("the dot shrinks and drops when a glide starts, and rises once the story settles", () => {
    expect(liftStep("shown", "glideStart", dotGliding)).toMatchObject({ phase: "hiding", motion: "play" });
    expect(liftStep("hiding", "hideDone", dotGliding)).toMatchObject({ phase: "hidden", motion: "none" });
    expect(liftStep("hidden", "glideEnd", settled)).toMatchObject({ phase: "returning", motion: "reverse" });
    expect(liftStep("returning", "returnDone", settled)).toMatchObject({ phase: "shown", motion: "none" });
  });

  it("an open button first folds back into its dot, then the dot hides", () => {
    expect(liftStep("shown", "glideStart", buttonGliding)).toMatchObject({ phase: "folding", motion: "fold" });
    expect(liftStep("folding", "foldDone", dotGliding)).toMatchObject({ phase: "hiding", motion: "play" });
  });

  it("a glide already over when the fold ends: the dot just stays", () => {
    expect(liftStep("folding", "glideEnd", settled)).toMatchObject({ phase: "folding", motion: "none" });
    expect(liftStep("folding", "foldDone", settled)).toMatchObject({ phase: "shown", motion: "none" });
  });

  it("the story settling while the dot is still dropping: it plays straight back", () => {
    expect(liftStep("hiding", "glideEnd", settled)).toMatchObject({ phase: "returning", motion: "reverse" });
  });

  it("a new glide during the return: hides again", () => {
    expect(liftStep("returning", "glideStart", dotGliding)).toMatchObject({ phase: "hiding", motion: "play" });
  });

  it("where it shouldn't show (Contact, a panel): put back at once, hidden by its root", () => {
    expect(liftStep("hidden", "glideEnd", away)).toMatchObject({ phase: "shown", motion: "snapShown" });
    expect(liftStep("hiding", "glideEnd", away)).toMatchObject({ phase: "shown", motion: "snapShown" });
    expect(liftStep("shown", "glideEnd", away)).toMatchObject({ phase: "shown", motion: "none" });
  });

  it("a glide starting while it's away: out of sight at once, so it rises when the story settles", () => {
    expect(liftStep("shown", "glideStart", { ...away, gliding: true })).toMatchObject({ phase: "hidden", motion: "snapHidden" });
    expect(liftStep("hidden", "glideEnd", settled)).toMatchObject({ phase: "returning", motion: "reverse" });
  });

  it("ignores events that don't apply", () => {
    expect(liftStep("shown", "hideDone", settled)).toMatchObject({ phase: "shown", motion: "none" });
    expect(liftStep("shown", "returnDone", settled)).toMatchObject({ phase: "shown", motion: "none" });
    expect(liftStep("shown", "foldDone", settled)).toMatchObject({ phase: "shown", motion: "none" });
    expect(liftStep("hidden", "glideStart", dotGliding)).toMatchObject({ phase: "hidden", motion: "none" });
    expect(liftStep("folding", "glideStart", buttonGliding)).toMatchObject({ phase: "folding", motion: "none" });
  });
});
