import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useGateLive } from "#/components/pages/home/motion/gateLive";
import ModeGate from "#/components/pages/home/motion/ModeGate";

/** A stand-in for one mode's side of the page: says whether it may start. */
const Probe = ({ name }: { name: string }) =>
  createElement("p", null, `${name}:${useGateLive() ? "live" : "waiting"}`);

describe("the mode gate, on the server (the first paint)", () => {
  const html = renderToString(
    createElement(ModeGate, {
      full: createElement(Probe, { name: "journey" }),
      calm: createElement(Probe, { name: "book" }),
    }),
  );

  it("sends both modes, the journey first, neither started", () => {
    expect(html).toContain("journey:waiting");
    expect(html).toContain("book:waiting");
    expect(html.indexOf("journey")).toBeLessThan(html.indexOf("book"));
  });

  it("lets the CSS show one: the journey with `data-motion=full`, the book otherwise (calm, or no script)", () => {
    expect(html).toMatch(/<div class="hidden full:contents"><p>journey/);
    expect(html).toMatch(/<div class="contents full:hidden"><p>book/);
  });
});
