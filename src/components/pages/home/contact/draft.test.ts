import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { contactDraft, keepDraft } from "./draft";

/** The form on the page, with what's written in it (null: no form). */
const page = (values: Record<string, string> | null) => {
  vi.stubGlobal("document", { querySelector: () => values });
  vi.stubGlobal(
    "FormData",
    class {
      constructor(private form: Record<string, string>) {}
      get(name: string) {
        return this.form[name] ?? null;
      }
    },
  );
};

describe("keepDraft", () => {
  beforeEach(() => {
    contactDraft.current = null;
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps what's written, a field or more", () => {
    page({ name: "Ada", email: "", message: "Half a thought" });
    keepDraft();
    expect(contactDraft.current).toEqual({ name: "Ada", email: "", message: "Half a thought" });
  });

  it("keeps nothing for an empty form, even over an older draft", () => {
    contactDraft.current = { name: "Old", email: "", message: "" };
    page({ name: "", email: "", message: "" });
    keepDraft();
    expect(contactDraft.current).toBeNull();
  });
});
