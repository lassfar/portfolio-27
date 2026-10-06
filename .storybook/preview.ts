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
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
