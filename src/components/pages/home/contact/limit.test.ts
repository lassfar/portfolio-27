import { describe, expect, it } from "vitest";
import { recordSent, SENT_KEY, sentToday } from "./limit";

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 9, 10, 12);

/** A browser's storage, in memory. */
const memory = (start: Record<string, string> = {}) => {
  const data = new Map(Object.entries(start));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
  };
};

describe("this browser's sends today", () => {
  it("counts the ones of the last day only", () => {
    const store = memory({ [SENT_KEY]: JSON.stringify([NOW - 25 * HOUR, NOW - 23 * HOUR, NOW]) });
    expect(sentToday(NOW, store)).toEqual([NOW - 23 * HOUR, NOW]);
  });

  it("keeps each send, and lets the old ones drop out", () => {
    const store = memory({ [SENT_KEY]: JSON.stringify([NOW - 30 * HOUR]) });
    recordSent(NOW - HOUR, store);
    recordSent(NOW, store);
    expect(JSON.parse(store.getItem(SENT_KEY)!)).toEqual([NOW - HOUR, NOW]);
    expect(sentToday(NOW + 23 * HOUR, store)).toEqual([NOW]);
  });

  it("is none with nothing kept, something unreadable, or no storage", () => {
    expect(sentToday(NOW, memory())).toEqual([]);
    expect(sentToday(NOW, memory({ [SENT_KEY]: "not json" }))).toEqual([]);
    expect(sentToday(NOW, memory({ [SENT_KEY]: '{"a":1}' }))).toEqual([]);
    expect(sentToday(NOW, null)).toEqual([]);
  });

  it("ignores times from the future (a clock set back)", () => {
    expect(sentToday(NOW, memory({ [SENT_KEY]: JSON.stringify([NOW + HOUR]) }))).toEqual([]);
  });

  it("doesn't fail when storage refuses to keep it", () => {
    const full = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(() => recordSent(NOW, full)).not.toThrow();
  });
});
