import { afterEach, describe, expect, it, vi } from "vitest";
import { checkEmail, editDistance, likelyDomain, lookupMail } from "./email";

/** Every domain takes mail. */
const takesMail = async () => true;

/** Cloudflare answers each record type with this JSON. */
const dns = (answers: Record<string, unknown>) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const type = new URL(String(input)).searchParams.get("type") ?? "";
    return new Response(JSON.stringify(answers[type] ?? { Status: 0 }), { status: 200 });
  });

afterEach(() => vi.restoreAllMocks());

describe("the address's format", () => {
  it.each(["ada", "ada@", "ada@lovelace", "@lovelace.dev", "ada lovelace@x.dev", "ada@x.d"])(
    "turns down %s",
    async (address) => {
      await expect(checkEmail(address, { lookup: takesMail })).resolves.toMatchObject({
        reason: "format",
      });
    },
  );

  it("takes a usual address, trimmed", async () => {
    await expect(checkEmail("  ada@lovelace.dev ", { lookup: takesMail })).resolves.toEqual({
      ok: true,
    });
  });
});

describe("throwaway inboxes", () => {
  it("turns them down, their subdomains too", async () => {
    for (const address of ["x@mailinator.com", "x@YOPMAIL.com", "x@eu.guerrillamail.com"])
      await expect(checkEmail(address, { lookup: takesMail })).resolves.toMatchObject({
        reason: "throwaway",
      });
  });
});

describe("typos in a common domain", () => {
  it("counts a swap of two letters as one edit", () => {
    expect(editDistance("gmial.com", "gmail.com")).toBe(1);
    expect(editDistance("gmail.com", "gmail.com")).toBe(0);
  });

  it("suggests the common domain for a near miss", () => {
    expect(likelyDomain("gmial.com")).toBe("gmail.com");
    expect(likelyDomain("gmail.con")).toBe("gmail.com");
    expect(likelyDomain("hotmial.com")).toBe("hotmail.com");
    expect(likelyDomain("outlok.com")).toBe("outlook.com");
  });

  it("leaves common and unrelated domains alone", () => {
    expect(likelyDomain("gmail.com")).toBeNull();
    expect(likelyDomain("mail.com")).toBeNull();
    expect(likelyDomain("lovelace.dev")).toBeNull();
  });

  it("offers the whole corrected address, unless they kept theirs", async () => {
    await expect(checkEmail("Ada.L@gmial.com", { lookup: takesMail })).resolves.toEqual({
      ok: false,
      reason: "typo",
      suggestion: "Ada.L@gmail.com",
    });
    await expect(
      checkEmail("Ada.L@gmial.com", { typoKept: true, lookup: takesMail }),
    ).resolves.toEqual({ ok: true });
  });
});

describe("whether the domain takes mail", () => {
  it("asks the lookup with the domain only", async () => {
    const lookup = vi.fn(async () => false);
    await expect(checkEmail("ada@nowhere.xyz", { lookup })).resolves.toEqual({
      ok: false,
      reason: "domain",
      domain: "nowhere.xyz",
    });
    expect(lookup).toHaveBeenCalledWith("nowhere.xyz");
  });

  it("is yes with mail servers", async () => {
    dns({ MX: { Status: 0, Answer: [{ type: 15, data: "10 mx.lovelace.dev." }] } });
    await expect(lookupMail("lovelace.dev")).resolves.toBe(true);
  });

  it("is no when the domain doesn't exist", async () => {
    dns({ MX: { Status: 3 } });
    await expect(lookupMail("nowhere.xyz")).resolves.toBe(false);
  });

  it("is no when it says it takes no mail (a null MX)", async () => {
    dns({ MX: { Status: 0, Answer: [{ type: 15, data: "0 ." }] } });
    await expect(lookupMail("example.com")).resolves.toBe(false);
  });

  it("falls back to the domain's address when it has no mail servers", async () => {
    dns({ MX: { Status: 0 }, A: { Status: 0, Answer: [{ type: 1, data: "203.0.113.7" }] } });
    await expect(lookupMail("lovelace.dev")).resolves.toBe(true);
    dns({ MX: { Status: 0 }, A: { Status: 0 } });
    await expect(lookupMail("lovelace.dev")).resolves.toBe(false);
  });

  it("can't tell when the lookup fails, and lets the message go", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(lookupMail("lovelace.dev")).resolves.toBe(true);
  });
});
