import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { inCalm } from "#/stories/motion";
import { useGateLive } from "./gateLive";
import ModeGate from "./ModeGate";

/** A stand-in for one mode's side of the page: says whether it may start. */
const Probe = ({ name }: { name: string }) => (
  <p className="p-6 text-white/80">
    {name}: {useGateLive() ? "live" : "waiting"}
  </p>
);

/**
 * The page's mode gate (P27-93): the journey with motion, the calm book in the calm mode. Here
 * with stand-ins for the two (and never reloading: only the site asks it to).
 */
const meta = {
  title: "Home/Motion/ModeGate",
  component: ModeGate,
  tags: ["autodocs"],
  args: { full: <Probe name="The journey" />, calm: <Probe name="The calm book" /> },
  argTypes: { full: { control: false }, calm: { control: false } },
} satisfies Meta<typeof ModeGate>;

export default meta;

type Story = StoryObj<typeof meta>;

/** With motion: only the journey stays, and it is live (it may start its pin, scroll and 3D). */
export const Full: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("The journey: live")).toBeVisible();
    await expect(canvas.queryByText(/The calm book/)).toBeNull();
  },
};

/** In the calm mode: only the calm book stays, live (its dots draw). */
export const Calm: Story = {
  beforeEach: inCalm,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("The calm book: live")).toBeVisible();
    await expect(canvas.queryByText(/The journey/)).toBeNull();
  },
};
