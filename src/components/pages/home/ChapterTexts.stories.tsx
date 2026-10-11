import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { plainText } from "#/components/UI/text/accent";
import { CHAPTER_NAMES, VOICE } from "#/components/pages/home/story/copy";
import ChapterTexts from "./ChapterTexts";

/** The journey's words for screen readers (the 3D's chapters, the lines around the overlays): unseen, so the canvas is empty. */
const meta = {
  title: "Home/ChapterTexts",
  component: ChapterTexts,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  args: {
    chapters: ["origin", "maker", "voyage", "earth", "lab", "way-out", "milky-way"],
  },
} satisfies Meta<typeof ChapterTexts>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every chapter but Origin and the Maker (under the overlays' own headings) has its heading; each says its voice line, without the accent marks. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const headings = canvas.getAllByRole("heading", { level: 2 });
    await expect(headings.map((h) => h.textContent)).toEqual([
      CHAPTER_NAMES.voyage,
      CHAPTER_NAMES.earth,
      CHAPTER_NAMES.lab,
      CHAPTER_NAMES["way-out"],
      CHAPTER_NAMES["milky-way"],
    ]);
    await expect(canvas.getByText(plainText(VOICE.origin))).toBeInTheDocument();
    await expect(canvas.getByText(plainText(VOICE.lab))).toBeInTheDocument();
    await expect(canvas.queryByText(/\*/)).not.toBeInTheDocument();
  },
};
