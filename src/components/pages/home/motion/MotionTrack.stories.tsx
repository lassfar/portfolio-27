import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { contrastOnPage } from "#/stories/contrast";
import { inCalm } from "#/stories/motion";
import MotionTrack from "./MotionTrack";

const knobOf = (root: HTMLElement) => root.querySelector<SVGCircleElement>(".motion-track__knob")!;
const dotsOf = (root: HTMLElement) => [
  ...root.querySelectorAll<SVGCircleElement>(".motion-track__dot"),
];

/** The track as the switch draws it: inside a switch button, whose `aria-checked` it follows. */
const meta = {
  title: "Home/MotionTrack",
  component: MotionTrack,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  args: { on: false },
  argTypes: { on: { control: "boolean", description: "The switch on: calm" } },
  render: ({ on }) => (
    <button
      type="button"
      role="switch"
      aria-label="Reduce motion"
      aria-checked={on}
      className="block rounded-full focus-ring"
    >
      <MotionTrack />
    </button>
  ),
} satisfies Meta<{ on: boolean }>;

export default meta;

type Story = StoryObj<typeof meta>;

/** With motion: the knob on the right, the dots in a wave. Hovered or focused, the wave settles a little, a hint of what a click does. The knob's core and the track's rim stand out from the page (3:1, WCAG 1.4.11). */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole("switch", { name: "Reduce motion" });
    const knob = knobOf(button);
    await expect(getComputedStyle(knob).transform).not.toBe("none");
    const core = knob.querySelector<SVGCircleElement>(".fill-peach")!;
    await expect(contrastOnPage(getComputedStyle(core).fill)).toBeGreaterThanOrEqual(3);
    const rail = button.querySelector<SVGRectElement>(".motion-track__rail")!;
    await expect(contrastOnPage(getComputedStyle(rail).stroke)).toBeGreaterThanOrEqual(3);
    const crest = dotsOf(button)[1];
    const high = getComputedStyle(crest).transform;
    await userEvent.tab();
    await waitFor(() => expect(getComputedStyle(crest).transform).not.toBe(high));
  },
};

/** In calm (the switch on): the knob on the left, the dots flat and dim. It jumps there, and nothing settles on focus (WCAG 2.3.3). */
export const Calm: Story = {
  args: { on: true },
  beforeEach: inCalm,
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole("switch", { name: "Reduce motion" });
    const knob = knobOf(button);
    await expect(getComputedStyle(knob).transform).toBe("none");
    await expect(getComputedStyle(knob).transitionProperty).toBe("opacity");
    await userEvent.tab();
    await expect(button).toHaveFocus();
    for (const dot of dotsOf(button)) await expect(getComputedStyle(dot).transform).toBe("none");
  },
};
