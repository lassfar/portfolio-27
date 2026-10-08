import { describe, expect, it } from "vitest";
import { loads } from "#/test/imports";

/** What the page loads at once, before it knows the mode (its layout and the page itself). */
const PAGE = ["app/layout.tsx", "app/page.tsx"];

/** GSAP as the calm mode may load it: the core (the swashes, the panels' rise) and its React hook. */
const GSAP_CORE = ["gsap", "@gsap/react"];

/** The 3D's packages. */
const THREE_D = ["three", "@react-three/fiber", "@react-three/drei", "postprocessing", "lil-gui"];

describe("the page, before it knows the mode (P27-95)", () => {
  const now = loads(PAGE, { dynamic: false });
  const later = loads(PAGE, { dynamic: true });

  it("loads none of GSAP's scroll plugins at once: the journey fetches them (loadJourney)", () => {
    const gsap = now.specifiers.filter(
      (s) => s === "gsap" || s.startsWith("gsap/") || s.startsWith("@gsap/"),
    );
    expect(gsap.filter((s) => !GSAP_CORE.includes(s))).toEqual([]);
  });

  it("loads none of the 3D at once", () => {
    expect(now.packages.filter((p) => THREE_D.includes(p))).toEqual([]);
  });

  it("still holds both modes and the switch, at once", () => {
    for (const file of [
      "components/pages/home/Hero.tsx",
      "components/pages/home/book/CalmBook.tsx",
      "components/pages/home/motion/modeSwitch.ts",
    ])
      expect(now.files).toContain(file);
  });

  it("fetches the journey's motion later, when it's the mode on screen", () => {
    for (const file of [
      "components/pages/home/journeyMotion.ts",
      "components/providers/Smoother.tsx",
      "components/pages/home/HeroMotion.tsx",
      "components/pages/home/scroll/land.ts",
    ])
      expect(later.files).toContain(file);
    expect(later.specifiers).toContain("gsap/all");
  });
});
