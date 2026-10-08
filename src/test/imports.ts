import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";

/**
 * What a module loads, all the way down, read from the source (P27-93, P27-95): for the
 * boundary tests, which keep one mode's code out of the other's. Node only (tests).
 */

export const SRC = join(process.cwd(), "src");

/**
 * Every `import … from "x"`, `export … from "x"`, `import "x"` and `import("x")`, with what
 * kind it is: groups 2 (`type`) and 3 (static), 4 (side effect), 5 (dynamic).
 */
const SPECIFIERS =
  /^\s*(import|export)(\s+type)?\s[^"';]*?\sfrom\s*["']([^"']+)["']|^\s*import\s+["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/gm;

const resolveLocal = (from: string, spec: string) => {
  const base = spec.startsWith("#/") ? join(SRC, spec.slice(2)) : join(dirname(from), spec);
  for (const end of ["", ".ts", ".tsx", "/index.ts", "/index.tsx"]) {
    const file = base + end;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }
  throw new Error(`Can't resolve ${spec} from ${relative(SRC, from)}`);
};

/** A package's name, from what's imported of it (`gsap/all` → `gsap`, `@gsap/react` → itself). */
const packageOf = (spec: string) =>
  spec
    .split("/")
    .slice(0, spec.startsWith("@") ? 2 : 1)
    .join("/");

export type Loads = {
  /** The source files reached (relative to src/). */
  files: string[];
  /** The packages, as imported (`gsap/all`, `next/dynamic`…). */
  specifiers: string[];
  /** The packages, by name. */
  packages: string[];
};

/**
 * What `entries` (paths under src/) load: their source files and packages, types left out
 * (they load nothing), CSS too. With `dynamic`, `import()` is followed as well: what they
 * may load later, not only at once.
 */
export function loads(entries: string | string[], { dynamic }: { dynamic: boolean }): Loads {
  const files = new Set<string>();
  const specifiers = new Set<string>();
  const visit = (file: string) => {
    if (files.has(file)) return;
    files.add(file);
    for (const m of readFileSync(file, "utf8").matchAll(SPECIFIERS)) {
      if (m[2]) continue; // `import type` / `export type`
      if (m[5] && !dynamic) continue;
      const spec = m[3] ?? m[4] ?? m[5];
      if (spec.endsWith(".css")) continue;
      if (spec.startsWith("#/") || spec.startsWith(".")) visit(resolveLocal(file, spec));
      else specifiers.add(spec);
    }
  };
  for (const entry of [entries].flat()) visit(join(SRC, entry));
  return {
    files: [...files].map((f) => relative(SRC, f)),
    specifiers: [...specifiers],
    packages: [...new Set([...specifiers].map(packageOf))],
  };
}
