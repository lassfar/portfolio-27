import { describe, expect, it } from "vitest";
import { accentParts, plainText } from "./accent";

describe("accented text", () => {
  it("splits a text into its plain and accented runs", () => {
    expect(accentParts("Before it has to *come apart*. *Dot by dot* — I've")).toEqual([
      { text: "Before it has to ", accent: false },
      { text: "come apart", accent: true },
      { text: ". ", accent: false },
      { text: "Dot by dot", accent: true },
      { text: " — I've", accent: false },
    ]);
  });

  it("handles an accent at the start or the end, and no accent", () => {
    expect(accentParts("*Home*, Morocco")).toEqual([
      { text: "Home", accent: true },
      { text: ", Morocco", accent: false },
    ]);
    expect(accentParts("Back to *London*")).toEqual([
      { text: "Back to ", accent: false },
      { text: "London", accent: true },
    ]);
    expect(accentParts("London")).toEqual([{ text: "London", accent: false }]);
  });

  it("drops the marks for the plain text", () => {
    expect(plainText("New Forest, *Brockenhurst*")).toBe("New Forest, Brockenhurst");
  });
});
