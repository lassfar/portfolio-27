import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { inertOutside } from "./inertOutside";

/** An element of a page, as inertOutside sees it (the unit tests run in Node). */
class FakeElement {
  inert = false;
  children: FakeElement[] = [];
  parentElement: FakeElement | null = null;
  constructor(readonly scrim = false) {}
  hasAttribute(name: string) {
    return name === "data-panel-scrim" && this.scrim;
  }
  append(...kids: FakeElement[]) {
    for (const kid of kids) {
      kid.parentElement = this;
      this.children.push(kid);
    }
    return this;
  }
}

describe("inertOutside", () => {
  let body: FakeElement;
  beforeEach(() => {
    body = new FakeElement();
    vi.stubGlobal("HTMLElement", FakeElement);
    vi.stubGlobal("document", { body });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("makes everything outside the dialog inert, up to <body>, and gives it back", () => {
    const page = new FakeElement();
    const dialog = new FakeElement();
    const viewer = new FakeElement();
    const layer = new FakeElement().append(dialog, viewer);
    body.append(page, layer);
    const undo = inertOutside(dialog as unknown as HTMLElement);
    expect([page.inert, viewer.inert, dialog.inert, layer.inert]).toEqual([
      true,
      true,
      false,
      false,
    ]);
    undo();
    expect([page.inert, viewer.inert]).toEqual([false, false]);
  });

  it("leaves what it's told to keep: the panel's scrim stays, to close it", () => {
    const scrim = new FakeElement(true);
    const dialog = new FakeElement();
    body.append(new FakeElement().append(scrim, dialog));
    inertOutside(dialog as unknown as HTMLElement, (el) => el.hasAttribute("data-panel-scrim"));
    expect(scrim.inert).toBe(false);
  });
});
