import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { GateLive } from "#/components/pages/home/motion/gateLive";
import LiveDrawing from "./LiveDrawing";

/** One of the calm book's 2D drawings, fetched and drawn once the book is the mode on screen. */
const meta = {
  title: "Home/Book/LiveDrawing",
  component: LiveDrawing,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: { name: { control: "select", options: ["craft", "parker"] } },
  args: { name: "craft" },
  decorators: [
    (Story) => (
      // The book's figure: 5:4, one image for screen readers.
      <figure
        role="img"
        aria-label="A drawing"
        className="relative m-0 aspect-5/4 w-150 max-w-[90vw]"
      >
        <Story />
      </figure>
    ),
  ],
} satisfies Meta<typeof LiveDrawing>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Live (the book on screen): the drawing's code is fetched, then it draws. Pick it in Controls. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const figure = canvas.getByRole("img", { name: "A drawing" });
    await waitFor(() => expect(figure.querySelector("svg")).not.toBeNull(), { timeout: 4000 });
  },
};

/** While the page loads (the book not yet the mode on screen): nothing is fetched or drawn; the figure's own label describes it meanwhile. */
export const Waiting: Story = {
  decorators: [
    (Story) => (
      <GateLive value={false}>
        <Story />
      </GateLive>
    ),
  ],
  play: async ({ canvas }) => {
    const figure = canvas.getByRole("img", { name: "A drawing" });
    await new Promise((resolve) => setTimeout(resolve, 300));
    await expect(figure).toBeEmptyDOMElement();
  },
};
