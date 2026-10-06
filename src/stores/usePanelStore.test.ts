import { beforeEach, describe, expect, it } from "vitest";
import { selectIsOpen, selectKey, selectView, usePanelStore } from "./usePanelStore";

const london = { kind: "place", id: "london" } as const;
const morocco = { kind: "place", id: "morocco" } as const;
const state = () => usePanelStore.getState();

describe("the scene's panel", () => {
  beforeEach(() =>
    usePanelStore.setState({ content: null, view: "full", photo: null, opened: false }),
  );

  it("opens in the full view, and marks a panel as opened", () => {
    state().open(london);
    expect(selectIsOpen(state())).toBe(true);
    expect(selectView(state())).toBe("full");
    expect(selectKey(state())).toBe("london");
    expect(state().opened).toBe(true);
  });

  it("switches to another place, closing the photo viewer", () => {
    state().open(london);
    state().openPhoto(2);
    state().open(morocco);
    expect(selectKey(state())).toBe("morocco");
    expect(state().photo).toBeNull();
  });

  it("does nothing when asked to open what's already open", () => {
    state().open(london);
    const before = state();
    state().open({ kind: "place", id: "london" });
    expect(state()).toBe(before);
  });

  it("steps back one step at a time: the photo, then the panel", () => {
    state().open(london);
    state().openPhoto(1);
    state().back();
    expect(state().photo).toBeNull();
    expect(selectIsOpen(state())).toBe(true);
    state().back();
    expect(selectIsOpen(state())).toBe(false);
  });

  it("closes the photo viewer with the panel", () => {
    state().open(london);
    state().openPhoto(1);
    state().close();
    expect(selectIsOpen(state())).toBe(false);
    expect(state().photo).toBeNull();
  });

  it("keeps the chosen view for the next opens, and reports none while closed", () => {
    state().open({ kind: "lab" });
    state().toggleView();
    expect(selectView(state())).toBe("side");
    state().close();
    expect(selectView(state())).toBeNull();
    state().open(london);
    expect(selectView(state())).toBe("side");
    expect(selectKey(state())).toBe("london");
  });
});
