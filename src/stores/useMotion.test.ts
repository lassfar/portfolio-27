import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MOTION_SCRIPT, MOTION_STORAGE_KEY } from "./motionPreference";

type Change = { matches: boolean };

/**
 * A browser for the store (the unit tests run in Node): the reduced-motion setting, which
 * can change, a storage, which can be blocked, the address, and <html>'s attributes.
 */
function fakeBrowser({
  device,
  stored = null,
  blocked = false,
  search = "",
}: {
  device: boolean;
  stored?: string | null;
  blocked?: boolean;
  /** The address's query (`?motion=calm`). */
  search?: string;
}) {
  const listeners = new Set<(event: Change) => void>();
  const query = {
    matches: device,
    addEventListener: (_type: string, fn: (event: Change) => void) => listeners.add(fn),
  };
  const items = new Map<string, string>();
  if (stored !== null) items.set(MOTION_STORAGE_KEY, stored);
  const refuse = () => {
    throw new Error("storage blocked");
  };
  const storage = blocked
    ? { getItem: refuse, setItem: refuse, removeItem: refuse }
    : {
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => void items.set(key, value),
        removeItem: (key: string) => void items.delete(key),
      };
  const attributes = new Map<string, string>();
  const matchMedia = () => query;
  const location = { search };
  vi.stubGlobal("window", { matchMedia, location });
  vi.stubGlobal("location", location);
  vi.stubGlobal("matchMedia", matchMedia);
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("document", {
    documentElement: {
      setAttribute: (name: string, value: string) => void attributes.set(name, value),
    },
  });
  return {
    items,
    /** <html>'s `data-motion`. */
    mode: () => attributes.get("data-motion"),
    /** The visitor changes the device setting. */
    change(next: boolean) {
      query.matches = next;
      listeners.forEach((fn) => fn({ matches: next }));
    },
  };
}

// A fresh store each time: it reads the browser once, as it loads.
const loadStore = () => import("./useMotion");

describe("the motion preference", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it("is full motion on the server", async () => {
    const { isCalm } = await loadStore();
    expect(isCalm()).toBe(false);
  });

  it("follows the device setting live, and marks <html>", async () => {
    const browser = fakeBrowser({ device: true });
    const { isCalm } = await loadStore();
    expect(isCalm()).toBe(true);
    expect(browser.mode()).toBe("calm");
    browser.change(false);
    expect(isCalm()).toBe(false);
    expect(browser.mode()).toBe("full");
  });

  it("lets a stored choice override the device setting, both ways", async () => {
    fakeBrowser({ device: false, stored: "calm:none" });
    expect((await loadStore()).isCalm()).toBe(true);
    vi.resetModules();
    fakeBrowser({ device: true, stored: "full:reduce" });
    expect((await loadStore()).isCalm()).toBe(false);
  });

  it("drops a stored choice once the device setting has changed since, or an old one without it", async () => {
    // Full motion, chosen while the device asked for nothing; the device now asks for calm.
    const browser = fakeBrowser({ device: true, stored: "full:none" });
    const { isCalm, useMotion } = await loadStore();
    expect(isCalm()).toBe(true);
    expect(useMotion.getState().choice).toBeNull();
    expect(browser.items.has(MOTION_STORAGE_KEY)).toBe(false);
    vi.resetModules();
    // Kept before the device setting was kept with it (P27-92).
    const old = fakeBrowser({ device: true, stored: "full" });
    expect((await loadStore()).isCalm()).toBe(true);
    expect(old.items.has(MOTION_STORAGE_KEY)).toBe(false);
  });

  it("ignores anything else in storage", async () => {
    fakeBrowser({ device: true, stored: "slow" });
    const { isCalm, useMotion } = await loadStore();
    expect(useMotion.getState().choice).toBeNull();
    expect(isCalm()).toBe(true);
  });

  it("takes a choice from the address first (the browser couldn't keep it), and ignores anything else there", async () => {
    fakeBrowser({ device: false, stored: "full:none", search: "?motion=calm" });
    expect((await loadStore()).isCalm()).toBe(true);
    vi.resetModules();
    fakeBrowser({ device: true, blocked: true, search: "?x=1&motion=full" });
    expect((await loadStore()).isCalm()).toBe(false);
    vi.resetModules();
    fakeBrowser({ device: false, stored: "calm:none", search: "?motion=slow" });
    expect((await loadStore()).isCalm()).toBe(true);
  });

  it("falls back to the device setting when storage is blocked, and a choice still applies", async () => {
    fakeBrowser({ device: true, blocked: true });
    const { isCalm, useMotion } = await loadStore();
    expect(isCalm()).toBe(true);
    expect(() => useMotion.getState().setChoice("full")).not.toThrow();
    expect(isCalm()).toBe(false);
  });

  it("saves a choice, clears it with null, and stays quiet on the same choice", async () => {
    const browser = fakeBrowser({ device: false });
    const { isCalm, useMotion } = await loadStore();
    const listener = vi.fn();
    useMotion.subscribe(listener);
    useMotion.getState().setChoice("calm");
    // Kept with the device setting it was made against.
    expect(browser.items.get(MOTION_STORAGE_KEY)).toBe("calm:none");
    expect(browser.mode()).toBe("calm");
    useMotion.getState().setChoice("calm");
    expect(listener).toHaveBeenCalledTimes(1);
    useMotion.getState().setChoice(null);
    expect(browser.items.has(MOTION_STORAGE_KEY)).toBe(false);
    expect(isCalm()).toBe(false);
    expect(browser.mode()).toBe("full");
  });

  it("keeps the server's state as its initial state (hydration renders from it)", async () => {
    fakeBrowser({ device: true, stored: "calm:reduce" });
    const { useMotion } = await loadStore();
    expect(useMotion.getInitialState()).toMatchObject({ device: false, choice: null });
  });

  it("marks the first paint the same way the store decides", async () => {
    for (const device of [false, true]) {
      for (const stored of [
        null,
        "calm:none",
        "calm:reduce",
        "full:none",
        "full:reduce",
        "full",
        "slow",
      ]) {
        for (const search of ["", "?motion=calm", "?motion=full", "?motion=slow"]) {
          vi.resetModules();
          const browser = fakeBrowser({ device, stored, search });
          new Function(MOTION_SCRIPT)();
          const painted = browser.mode();
          const { isCalm } = await loadStore();
          expect(painted, `${device} ${stored} ${search}`).toBe(isCalm() ? "calm" : "full");
        }
      }
    }
  });
});
