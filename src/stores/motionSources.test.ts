import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

/** Every source file (code and styles), tests left out. */
const sources = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.(tsx?|css)$/.test(name) && !/\.test\.ts$/.test(name) ? [path] : [];
  });

const files = sources(SRC).map((path) => ({
  file: relative(SRC, path),
  text: readFileSync(path, "utf8"),
}));

/*
 * The motion preference comes from one place (P27-91, P27-93): the device's setting, then the
 * visitor's choice on the site, read by stores/useMotion and mirrored as `data-motion`. A part
 * that read the device setting itself would miss the site's switch.
 */
describe("the motion preference's sources", () => {
  it("reads the device's reduced-motion setting in one place only", () => {
    expect(
      files.filter((f) => f.text.includes("prefers-reduced-motion")).map((f) => f.file),
    ).toEqual(["stores/motionPreference.ts"]);
  });

  it("uses no device-only Tailwind variant: movement is `moving:`, calm-only styles `calm:`", () => {
    expect(
      files.filter((f) => /motion-(reduce|safe):[\w[]/.test(f.text)).map((f) => f.file),
    ).toEqual([]);
  });
});
