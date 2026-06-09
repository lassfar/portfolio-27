import type { Config } from "tailwindcss";

// Tailwind v4 reads design tokens from globals.css @theme.
// This file is kept only for v3-compat options (darkMode, content paths).
export default {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
} satisfies Config;
