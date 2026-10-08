import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import Gallery from "#/stories/Gallery";
import { SHAPE_NAMES } from "#/components/pages/home/book/dots/dots.types";
import DotField from "./DotField";

/** Waits for a figure's dots: drawn and faded in (its canvas, once it has loaded). */
const drawn = (figure: HTMLElement) =>
  waitFor(
    () => {
      const canvas = figure.querySelector("canvas");
      if (!canvas || canvas.width === 0) throw new Error("No dots yet");
      expect(canvas).toHaveStyle({ opacity: "1" });
      return canvas;
    },
    { timeout: 4000 },
  );

/** How lit a square of the canvas is: the sum of its pixels' opacity (CSS px around x, y). */
const lightAround = (canvas: HTMLCanvasElement, x: number, y: number, half = 20) => {
  const k = canvas.width / canvas.getBoundingClientRect().width;
  const { data } = canvas
    .getContext("2d")!
    .getImageData((x - half) * k, (y - half) * k, half * 2 * k, half * 2 * k);
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i];
  return sum;
};

const meta = {
  title: "Home/Book/DotField",
  component: DotField,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: { shape: { control: "select", options: SHAPE_NAMES } },
  args: {
    shape: "saturn",
    label: "Saturn drawn in dots: peach bands on the planet, its rings tilted around it.",
    // A spread's figure: 5:4.
    className: "relative aspect-5/4 w-150 max-w-[90vw]",
  },
} satisfies Meta<typeof DotField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A figure of the calm book: one image for screen readers, its dots drawn once and faded in. Pick the shape in Controls. */
export const Default: Story = {
  play: async ({ canvas }) => {
    const figure = canvas.getByRole("img", { name: /Saturn drawn in dots/ });
    await drawn(figure);
  },
};

/** The five shapes, side by side: the star (the cover), Saturn (The Maker), the Earth and its places, the Lab's Sun, the Milky Way and "You are here". */
export const Shapes: Story = {
  parameters: { layout: "padded" },
  render: (args) => (
    <Gallery values={SHAPE_NAMES}>
      {(shape) => (
        <DotField {...args} shape={shape} label={shape} className="relative aspect-5/4 w-80" />
      )}
    </Gallery>
  ),
  play: async ({ canvas }) => {
    for (const shape of SHAPE_NAMES) await drawn(canvas.getByRole("img", { name: shape }));
    await waitFor(() => expect(canvas.getByText("London")).toBeInTheDocument());
    await expect(canvas.getByText("You are here")).toBeInTheDocument();
  },
};

/** Under the pointer the dots light up, then fade back once it leaves. Their light only: none moves or grows (WCAG 2.3.3). */
export const Lit: Story = {
  play: async ({ canvas, step }) => {
    const art = await drawn(canvas.getByRole("img"));
    const rect = art.getBoundingClientRect();
    const x = rect.width / 2;
    const y = rect.height / 2;
    const resting = lightAround(art, x, y);
    const far = lightAround(art, 40, 40);
    const point = (type: string) =>
      art.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerType: "mouse",
          clientX: rect.left + x,
          clientY: rect.top + y,
        }),
      );

    await step("the pointer touches the planet: its dots light up", async () => {
      point("pointermove");
      await waitFor(() => expect(lightAround(art, x, y)).toBeGreaterThan(resting * 1.15));
      // Far from it, nothing changed.
      await expect(lightAround(art, 40, 40)).toBe(far);
    });

    await step("it leaves: they fade back to rest", async () => {
      point("pointerleave");
      // Back as it was (within the edges' anti-aliasing).
      await waitFor(
        () => expect(Math.abs(lightAround(art, x, y) / resting - 1)).toBeLessThan(0.01),
        {
          timeout: 3000,
        },
      );
    });
  },
};
