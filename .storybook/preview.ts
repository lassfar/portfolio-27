import type { Preview } from "@storybook/nextjs-vite";
import "../src/styles/globals.css";
import { greatVibes, kronaOne } from "../src/app/fonts";

const preview: Preview = {
  // The site's display fonts, as in the app's layout: their variables on <html>, where the
  // @theme tokens that use them (`font-great-vibes`…) resolve.
  beforeAll: () => {
    document.documentElement.classList.add(greatVibes.variable, kronaOne.variable);
  },
  // Every story on the page's background (--color-rich-black); white is there to compare.
  initialGlobals: {
    backgrounds: { value: "dark" },
  },
  parameters: {
    // The Introduction, then the reusable components, then the home page's parts.
    options: {
      storySort: { order: ["Introduction", "UI", "Home"] },
    },
    backgrounds: {
      options: {
        dark: { name: "Rich black", value: "#19191C" },
        light: { name: "White", value: "#FFFFFF" },
      },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      // Every story's accessibility check (axe) fails its test, and so the commit hook (P27-82).
      test: "error",
    },
  },
};

export default preview;
