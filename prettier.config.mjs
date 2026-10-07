/**
 * Prettier (P27-96): the style the code was already written in (Prettier's defaults: double
 * quotes, semicolons, trailing commas, 2 spaces), lines up to 100 characters, and the
 * Tailwind classes sorted into Tailwind's order, in `className` and inside `clsx(…)`.
 * The pre-commit hook formats each commit's files (lint-staged); `npm run format` does it all.
 *
 * @type {import("prettier").Config & import("prettier-plugin-tailwindcss").PluginOptions}
 */
const config = {
  printWidth: 100,
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindStylesheet: "./src/styles/globals.css",
  tailwindFunctions: ["clsx"],
};

export default config;
