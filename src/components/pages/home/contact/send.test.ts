import { afterEach, describe, expect, it, vi } from "vitest";
import { FORMS_PATH, formBody, sendToNetlify } from "./send";

const MESSAGE = { name: "Ada Lovelace", email: "ada@lovelace.dev", message: "Hello & more" };

/** Answers every post with `status`. */
const answer = (status: number) =>
  vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status }));

/** The browser's connection, as `navigator.onLine` reports it (Node has none). */
const online = (value: boolean) => vi.stubGlobal("navigator", { onLine: value });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("the body Netlify Forms takes", () => {
  it("is URL-encoded, with the form's name and every field", () => {
    const body = new URLSearchParams(formBody(MESSAGE));
    expect(Object.fromEntries(body)).toEqual({ "form-name": "contact", ...MESSAGE });
    expect(formBody(MESSAGE)).toContain("message=Hello+%26+more");
  });
});

describe("sending to Netlify Forms", () => {
  it("posts the form to its hidden copy, URL-encoded", async () => {
    online(true);
    const post = answer(200);
    await sendToNetlify(MESSAGE);
    const [path, init] = post.mock.calls[0];
    expect(path).toBe(FORMS_PATH);
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/x-www-form-urlencoded" });
    expect(init?.body).toBe(formBody(MESSAGE));
  });

  it("fails when Netlify doesn't answer OK", async () => {
    online(true);
    answer(404);
    await expect(sendToNetlify(MESSAGE)).rejects.toThrow("404");
  });

  it("fails when the post itself fails", async () => {
    online(true);
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(sendToNetlify(MESSAGE)).rejects.toThrow("Failed to fetch");
  });

  it("fails at once when the browser is offline, without posting", async () => {
    online(false);
    const post = answer(200);
    await expect(sendToNetlify(MESSAGE)).rejects.toThrow("Offline");
    expect(post).not.toHaveBeenCalled();
  });
});
