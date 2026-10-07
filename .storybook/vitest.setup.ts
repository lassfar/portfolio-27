import * as a11yAddonAnnotations from "@storybook/addon-a11y/preview";
import { setProjectAnnotations } from "@storybook/nextjs-vite";
import * as projectAnnotations from "./preview";

// This is an important step to apply the right configuration when testing your stories.
// More info at: https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest#setprojectannotations
setProjectAnnotations([a11yAddonAnnotations, projectAnnotations]);
// The stories are tested outside Storybook's canvas, where the backgrounds addon doesn't paint:
// the page's background here too, so the a11y checks measure contrast against what a visitor sees.
document.body.classList.add("bg-rich-black");
