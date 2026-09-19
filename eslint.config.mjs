// Flat config for ESLint 10 + eslint-config-next 16.
// eslint-config-next ships native flat configs now, so we import them directly
// (no @eslint/eslintrc FlatCompat, which breaks under ESLint 10). The
// `core-web-vitals` config already includes the base Next + TypeScript rules.
// See: https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import next from "eslint-config-next/core-web-vitals";
import storybook from "eslint-plugin-storybook";

const eslintConfig = [
  ...next,
  ...storybook.configs["flat/recommended"],
  {
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
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "docs/**", // design prototypes / mockups — not app source
    ],
  },
];

export default eslintConfig;
