import { describe, expect, it, vi } from "vitest";
import { useGlide } from "./useGlide";

describe("useGlide", () => {
  it("notifies only when who's gliding changes", () => {
    const listener = vi.fn();
    const unsubscribe = useGlide.subscribe(listener);
    useGlide.getState().setBy(null); // already none: a wheel with no glide running
    expect(listener).not.toHaveBeenCalled();
    useGlide.getState().setBy("assistant");
    useGlide.getState().setBy("assistant");
    expect(listener).toHaveBeenCalledTimes(1);
    useGlide.getState().setBy(null);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
  });
});
