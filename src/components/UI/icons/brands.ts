import { createLucideIcon } from "lucide-react";

/*
 * Brand logos for the Contact links (P27-81). Lucide dropped its brand icons in 1.0: these
 * are its former thin-stroke GitHub and LinkedIn glyphs (lucide-static 0.460.0, ISC licence,
 * © Lucide Contributors), made into icons with `createLucideIcon`, so they take the same
 * props and stroke as any other icon (UI/Icon). Each part has a `key`, as Lucide's own do:
 * React renders them as a list.
 */

export const GitHub = createLucideIcon({
  name: "github",
  node: [
    [
      "path",
      {
        key: "github-mark",
        d: "M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4",
      },
    ],
    ["path", { key: "github-tail", d: "M9 18c-4.51 2-5-2-7-2" }],
  ],
});

export const LinkedIn = createLucideIcon({
  name: "linkedin",
  node: [
    [
      "path",
      {
        key: "linkedin-n",
        d: "M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z",
      },
    ],
    ["rect", { key: "linkedin-i", width: "4", height: "12", x: "2", y: "9" }],
    ["circle", { key: "linkedin-dot", cx: "4", cy: "4", r: "2" }],
  ],
});
