import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inertExcept } from "./inertExcept";

/** An element of the page, as inertExcept sees it (the unit tests run in Node). */
class FakeElement {
  inert = false;
  constructor(readonly keep = false) {}
  hasAttribute(name: string) {
    return name === "data-keep" && this.keep;
  }
}

let body: { children: FakeElement[] };
/** The page's MutationObserver: what it watches, and a way to add a child. */
let observer: { callback: MutationCallback; disconnected: boolean };
const arrive = (el: FakeElement) => {
  body.children.push(el);
  observer.callback([{ addedNodes: [el] } as unknown as MutationRecord], {} as MutationObserver);
};
const keep = (el: HTMLElement) => el.hasAttribute("data-keep");

describe("inertExcept", () => {
  beforeEach(() => {
    body = { children: [] };
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("document", { body });
    vi.stubGlobal(
      "MutationObserver",
      class {
        constructor(callback: MutationCallback) {
          observer = { callback, disconnected: false };
        }
        observe() {}
        disconnect() {
          observer.disconnected = true;
        }
      },
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("makes the page inert, all but what it keeps", () => {
    const page = new FakeElement();
    const kept = new FakeElement(true);
    body.children.push(page, kept);
    inertExcept(keep);
    expect(page.inert).toBe(true);
    expect(kept.inert).toBe(false);
  });

  it("makes what arrives meanwhile inert too (a new tree's portals), and gives it all back", () => {
    const page = new FakeElement();
    body.children.push(page);
    const release = inertExcept(keep);
    const portal = new FakeElement();
    arrive(portal);
    expect(portal.inert).toBe(true);
    release();
    expect(page.inert).toBe(false);
    expect(portal.inert).toBe(false);
    expect(observer.disconnected).toBe(true);
  });

  it("leaves alone what was inert already (a closed dialog), even when released", () => {
    const closed = new FakeElement();
    closed.inert = true;
    body.children.push(closed);
    inertExcept(keep)();
    expect(closed.inert).toBe(true);
  });
});
