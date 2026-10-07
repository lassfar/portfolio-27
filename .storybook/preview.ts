import type { Preview } from "@storybook/nextjs-vite";
import "../src/styles/globals.css";
import { greatVibes, kronaOne } from "../src/app/fonts";
import { useMotion } from "../src/stores/useMotion";

const preview: Preview = {
  // The site's display fonts, as in the app's layout: their variables on <html>, where the
  // @theme tokens that use them (`font-great-vibes`…) resolve.
  beforeAll: () => {
    document.documentElement.classList.add(greatVibes.variable, kronaOne.variable);
  },
  // The toolbar's Motion (P27-92): any story in full motion, or calm (reduced motion: no lift,
  // no slide, no scale, only short fades), as a visitor who chose it would see it. Through the
  // store's state only, never saved in the browser.
  globalTypes: {
    motion: {
      description: "Full motion, or calm (reduced motion)",
      toolbar: {
        title: "Motion",
        icon: "lightning",
        items: [
          { value: "full", title: "Full motion" },
          { value: "calm", title: "Calm" },
        ],
        dynamicTitle: true,
      },
    },
  },
  beforeEach: ({ globals }) => {
    useMotion.setState({ choice: globals.motion === "calm" ? "calm" : null });
    return () => useMotion.setState({ choice: null });
  },
  // Every story on the page's background (--color-rich-black); white is there to compare.
  initialGlobals: {
    backgrounds: { value: "dark" },
    motion: "full",
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
