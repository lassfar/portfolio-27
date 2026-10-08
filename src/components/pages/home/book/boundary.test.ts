import { describe, expect, it } from "vitest";
import { loads } from "#/test/imports";

/** The 3D's packages: none may load in the calm mode (P27-93). */
const THREE_D = ["three", "@react-three/fiber", "@react-three/drei", "postprocessing", "lil-gui"];

/** The only modules of the 3D's folder the book may read: plain data, no imports. */
const DATA_ONLY = ["components/three.js/earth/data.ts", "components/three.js/voyager/data.ts"];

describe("the calm book", () => {
  // Now or later: its dynamic imports too.
  const book = loads("components/pages/home/book/CalmBook.tsx", { dynamic: true });

  it("loads none of the 3D's packages, all the way down", () => {
    expect(book.packages.filter((p) => THREE_D.includes(p))).toEqual([]);
    // It does load what it needs: the panels' icons, the stores.
    expect(book.packages).toContain("zustand");
  });

  it("reads only plain data from the 3D's folder", () => {
    book.files
      .filter((f) => f.startsWith("components/three.js/"))
      .forEach((f) => expect(DATA_ONLY, f).toContain(f));
  });

  it("reaches its dotted shapes, panels and form (the walk follows dynamic imports too)", () => {
    expect(book.files).toContain("components/pages/home/book/dots/DotCanvas.tsx");
    expect(book.files).toContain("components/pages/home/panel/ScenePanel.tsx");
    expect(book.files).toContain("components/pages/home/contact/Contact.tsx");
  });
});
