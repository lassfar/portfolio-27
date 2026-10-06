import { beforeEach, describe, expect, it } from "vitest";
import { selectIsOpen, selectKey, usePanelStore } from "./usePanelStore";

const london = { kind: "place", id: "london" } as const;
const morocco = { kind: "place", id: "morocco" } as const;
const state = () => usePanelStore.getState();

describe("the scene's panel", () => {
  beforeEach(() =>
    usePanelStore.setState({ content: null, view: "side", photo: null, opened: false }),
  );

  it("opens as a side panel, and marks a panel as opened", () => {
    state().open(london);
    expect(selectIsOpen(state())).toBe(true);
    expect(state().view).toBe("side");
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

  it("keeps the chosen view for the next opens", () => {
    state().open({ kind: "lab" });
    state().toggleView();
    expect(state().view).toBe("full");
    state().close();
    expect(selectKey(state())).toBeNull();
    state().open(london);
    expect(state().view).toBe("full");
    expect(selectKey(state())).toBe("london");
  });
});
