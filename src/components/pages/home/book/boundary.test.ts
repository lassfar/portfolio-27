import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

/** The 3D's packages: none may load in the calm mode (P27-93). */
const THREE_D = ["three", "@react-three/fiber", "@react-three/drei", "postprocessing", "lil-gui"];

/** The only modules of the 3D's folder the book may read: plain data, no imports. */
const DATA_ONLY = ["components/three.js/earth/data.ts", "components/three.js/voyager/data.ts"];

/** Every `import … from "x"`, `export … from "x"` and `import("x")`, with what kind it is. */
const SPECIFIERS =
  /^\s*(import|export)(\s+type)?\s[^"';]*?\sfrom\s*["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/gm;

const resolveLocal = (from: string, spec: string) => {
  const base = spec.startsWith("#/") ? join(SRC, spec.slice(2)) : join(dirname(from), spec);
  for (const end of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const file = base + end;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  throw new Error(`Can't resolve ${spec} from ${relative(SRC, from)}`);
};

/** What a module loads, all the way down: its source files and its packages (types left out: they load nothing). */
const loads = (entry: string) => {
  const files = new Set<string>();
  const packages = new Set<string>();
  const visit = (file: string) => {
    if (files.has(file)) return;
    files.add(file);
    for (const m of readFileSync(file, "utf8").matchAll(SPECIFIERS)) {
      if (m[2]) continue; // `import type` / `export type`
      const spec = m[3] ?? m[4];
      if (spec.startsWith("#/") || spec.startsWith(".")) visit(resolveLocal(file, spec));
      else
        packages.add(
          spec
            .split("/")
            .slice(0, spec.startsWith("@") ? 2 : 1)
            .join("/"),
        );
    }
  };
  visit(join(SRC, entry));
  return { files: [...files].map((f) => relative(SRC, f)), packages: [...packages] };
};

describe("the calm book", () => {
  const book = loads("components/pages/home/book/CalmBook.tsx");

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
