import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { queueDotBuild } from "./buildQueue";

describe("the dotted figures' build queue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("builds one figure per task, in order", () => {
    const built: string[] = [];
    queueDotBuild(() => built.push("star"));
    queueDotBuild(() => built.push("saturn"));
    expect(built).toEqual([]);
    vi.advanceTimersToNextTimer();
    expect(built).toEqual(["star"]);
    vi.advanceTimersToNextTimer();
    expect(built).toEqual(["star", "saturn"]);
  });

  it("drops a build that's cancelled before its turn", () => {
    const build = vi.fn();
    const cancel = queueDotBuild(build);
    cancel();
    vi.runAllTimers();
    expect(build).not.toHaveBeenCalled();
  });
});
