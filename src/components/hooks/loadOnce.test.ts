import { describe, expect, it, vi } from "vitest";
import { loadOnce } from "./loadOnce";

describe("loadOnce", () => {
  it("fetches once, for everyone who asks", async () => {
    const load = vi.fn(async () => ({ default: "module" }));
    const loader = loadOnce(load);
    const [a, b] = await Promise.all([loader(), loader()]);
    await loader();
    expect(load).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("gives the module at once after it has arrived, nothing before", async () => {
    const loader = loadOnce(async () => ({ default: "module" }));
    expect(loader.loaded).toBeNull();
    const arrived = await loader();
    expect(loader.loaded).toBe(arrived);
  });

  it("can try again after a failed fetch", async () => {
    const load = vi
      .fn<() => Promise<{ default: string }>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce({ default: "module" });
    const loader = loadOnce(load);
    await expect(loader()).rejects.toThrow("offline");
    expect(loader.loaded).toBeNull();
    await expect(loader()).resolves.toEqual({ default: "module" });
    expect(load).toHaveBeenCalledTimes(2);
  });
});
