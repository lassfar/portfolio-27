// Flat config for ESLint 10 + eslint-config-next 16.
// eslint-config-next ships native flat configs now, so we import them directly
// (no @eslint/eslintrc FlatCompat, which breaks under ESLint 10). The
// `core-web-vitals` config already includes the base Next + TypeScript rules.
// See: https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import next from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";
import storybook from "eslint-plugin-storybook";

/**
 * Unused imports, variables and parameters fail lint (P27-84). Exempt: parameters named
 * `_…`, and props destructured beside a rest to strip them (`{ label: _label, ...control }`).
 * Not `_…` variables: here a leading `_` marks a reused scratch object (`_up`, `_dragKept`),
 * so an unused one is a leftover.
 */
const UNUSED = {
  args: "after-used",
  argsIgnorePattern: "^_",
  caughtErrorsIgnorePattern: "^_",
  ignoreRestSiblings: true,
};

const eslintConfig = [
  ...next,
  ...storybook.configs["flat/recommended"],
  {
    // Where Next registers the react-hooks plugin: elsewhere (a .cjs script) these rules
    // would point at a missing plugin and crash lint.
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    // This codebase is intentionally imperative (Three.js / React Three Fiber /
    // GSAP): it mutates three.js objects + refs inside useFrame and generates
    // particle buffers with Math.random in useMemo. The React-Compiler-era
    // react-hooks rules that eslint-config-next 16 enables flag those legitimate
    // patterns as errors, so we turn them off here. Classic exhaustive-deps stays
    // on as a warning.
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/use-memo": "off",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
  {
    // Where Next registers the TypeScript plugin.
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "no-unused-vars": "off", // the TypeScript rule replaces it (it understands types)
      "@typescript-eslint/no-unused-vars": ["error", UNUSED],
    },
  },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    rules: { "no-unused-vars": ["error", UNUSED] },
  },
  // Prettier owns the formatting (P27-96): any rule above about layout or style is turned off.
  prettier,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "docs/**", // design prototypes / mockups — not app source
      ".claude/**", // the agent's local workspace (task notes, tools) — not app source
    ],
  },
];

export default eslintConfig;
