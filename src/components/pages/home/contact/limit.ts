/**
 * Two messages a day from one browser (P27-66): the times this browser sent one, kept for a
 * rolling day. Only real sends count (not a failed one, nor a bot's). With storage blocked
 * there's no limit: a message is never lost to it.
 */

/** Where this browser keeps its sends' times (ms). */
export const SENT_KEY = "p27.contact.sent";

const DAY_MS = 24 * 60 * 60 * 1000;

/** What's read and written: the browser's local storage (null when it's blocked). */
type Store = Pick<Storage, "getItem" | "setItem"> | null;

const localStore = (): Store => {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

/** The times messages were sent from this browser in the last day. */
export function sentToday(now = Date.now(), store: Store = localStore()): number[] {
  try {
    const times: unknown = JSON.parse(store?.getItem(SENT_KEY) ?? "[]");
    if (!Array.isArray(times)) return [];
    return times.filter((t): t is number => typeof t === "number" && t <= now && now - t < DAY_MS);
  } catch {
    return [];
  }
}

/** Keeps that a message was just sent (older ones drop out). */
export function recordSent(now = Date.now(), store: Store = localStore()): void {
  try {
    store?.setItem(SENT_KEY, JSON.stringify([...sentToday(now, store), now]));
  } catch {
    // Full or blocked: no limit then.
  }
}
