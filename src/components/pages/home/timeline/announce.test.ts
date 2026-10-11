import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANNOUNCE_SETTLE_MS, chapterAnnouncer } from "./announce";

describe("chapterAnnouncer", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("says a new chapter once it has held, not the one the page opened on", () => {
    const say = vi.fn();
    const a = chapterAnnouncer(say);
    a.next(0); // opened here: only noted
    vi.advanceTimersByTime(ANNOUNCE_SETTLE_MS * 2);
    expect(say).not.toHaveBeenCalled();
    a.next(1);
    vi.advanceTimersByTime(ANNOUNCE_SETTLE_MS - 1);
    expect(say).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(say).toHaveBeenCalledExactlyOnceWith(1);
  });

  it("only says where a glide stops, not the chapters it passes", () => {
    const say = vi.fn();
    const a = chapterAnnouncer(say);
    a.next(0);
    for (const i of [1, 2, 3, 4]) {
      a.next(i);
      vi.advanceTimersByTime(200);
    }
    vi.advanceTimersByTime(ANNOUNCE_SETTLE_MS);
    expect(say).toHaveBeenCalledExactlyOnceWith(4);
  });

  it("doesn't say a chapter again when the scroll just brushed the next one", () => {
    const say = vi.fn();
    const a = chapterAnnouncer(say);
    a.next(0);
    a.next(2);
    vi.advanceTimersByTime(ANNOUNCE_SETTLE_MS);
    a.next(3);
    vi.advanceTimersByTime(100);
    a.next(2); // back before it held
    vi.advanceTimersByTime(ANNOUNCE_SETTLE_MS);
    expect(say.mock.calls).toEqual([[2]]);
  });

  it("only notes a chapter passed quietly (a mode switch lands there)", () => {
    const say = vi.fn();
    const a = chapterAnnouncer(say);
    a.next(0);
    a.next(4, true);
    vi.advanceTimersByTime(ANNOUNCE_SETTLE_MS);
    a.next(4); // the screen gone, still there: nothing new
    vi.advanceTimersByTime(ANNOUNCE_SETTLE_MS);
    expect(say).not.toHaveBeenCalled();
  });

  it("drops a pending one when stopped", () => {
    const say = vi.fn();
    const a = chapterAnnouncer(say);
    a.next(0);
    a.next(1);
    a.stop();
    vi.advanceTimersByTime(ANNOUNCE_SETTLE_MS);
    expect(say).not.toHaveBeenCalled();
  });
});
