import { createLucideIcon } from "lucide-react";

/*
 * The motion switch's two glyphs (P27-92), as drawn in the agreed prototype
 * (docs/design/mockups/14-calm-story.html): three still lines for calm motion, three waves
 * for full motion. Made into icons with `createLucideIcon`, so they take the same props and
 * stroke as any other (UI/Icon).
 */

export const Calm = createLucideIcon({
  name: "calm",
  node: [["path", { key: "calm-lines", d: "M4 8h16M4 12h16M4 16h16" }]],
});

export const Lively = createLucideIcon({
  name: "lively",
  node: [
    [
      "path",
      {
        key: "lively-waves",
        d: "M3 8c3-3 6 3 9 0s6 3 9 0M3 12c3-3 6 3 9 0s6 3 9 0M3 16c3-3 6 3 9 0s6 3 9 0",
      },
    ],
  ],
});
