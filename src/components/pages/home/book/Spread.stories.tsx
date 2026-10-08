import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import DotField from "#/components/pages/home/book/dots/DotField";
import { BODY, FIGURE } from "#/components/pages/home/book/layout";
import { ABOUT, BOOK } from "#/components/pages/home/story/copy";
import { revealed, withReveal } from "#/stories/reveal";
import Spread from "./Spread";

const meta = {
  title: "Home/Book/Spread",
  component: Spread,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [withReveal],
  args: {
    id: "maker",
    title: ABOUT.title,
    flip: false,
    figure: <DotField shape="saturn" label={BOOK.figures.saturn} className={FIGURE} />,
    children: ABOUT.paragraphs.map((p) => (
      <p key={p} className={BODY}>
        {p}
      </p>
    )),
  },
  argTypes: { figure: { control: false }, children: { control: false } },
} satisfies Meta<typeof Spread>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A chapter of the calm book: its shape on the left, its words on the right (a phone stacks them, the shape first). Both fade in as they show. */
export const Default: Story = {
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("heading", { level: 2 })).toHaveTextContent("Small, Patient");
    await expect(canvas.getByText(/Chapter 2/)).toHaveTextContent("Chapter 2 · The Maker");
    await expect(canvas.getByRole("img", { name: BOOK.figures.saturn })).toBeInTheDocument();
    await revealed(canvasElement);
  },
};

/** Flipped: the shape on the right (the spreads alternate). */
export const Flipped: Story = {
  args: { flip: true },
  play: async ({ canvas, canvasElement }) => {
    const figure = canvas.getByRole("img", { name: BOOK.figures.saturn });
    const title = canvas.getByRole("heading", { level: 2 });
    await expect(figure.getBoundingClientRect().left).toBeGreaterThan(
      title.getBoundingClientRect().left,
    );
    await revealed(canvasElement);
  },
};
